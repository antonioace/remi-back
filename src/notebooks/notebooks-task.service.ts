import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotebookEvent,
  NotebookEventStatus,
  NotebookEventType,
} from './entities/notebook-event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notebook } from './entities/notebook.entity';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Injectable()
export class NotebooksTaskService {
  private readonly logger = new Logger(NotebooksTaskService.name);

  constructor(
    @InjectRepository(Notebook)
    private readonly notebookRepository: Repository<Notebook>,
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) { }

  // Run every 20 seconds
  @Cron('*/20 * * * * *')
  async handleCron() {
    this.logger.debug('Running cron job to process pending notebook events');

    const now = new Date();
    const pendingEvents = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin(Notebook, 'notebook', 'notebook.id = event.notebookId')
      .where('event.status = :status', { status: NotebookEventStatus.PENDING })
      // Only pick events whose own assignedAt is due OR, if null, use notebook.assignedAt
      .andWhere(
        '((event.assignedAt IS NULL AND notebook.assignedAt IS NULL) OR COALESCE(event.assignedAt, notebook.assignedAt) <= :now)',
        { now },
      )
      .addSelect('COALESCE(event.assignedAt, notebook.assignedAt, event.createdAt)', 'sortDate')
      .orderBy('sortDate', 'ASC')
      .take(10)
      .getMany();

    for (const event of pendingEvents) {
      try {
        this.logger.log(`Processing event ${event.id} of type ${event.type}`);
        const notebook = await this.notebookRepository.findOne({
          where: { id: event.notebookId }
        })

        await this.notificationsService.create(event.userId, {
          title: notebook?.name || 'Notebook Event',
          message: notebook?.description ? `${notebook.description}` : `Your notebook event of type ${event.type} has been processed.`,
        });

        const title = notebook?.name || 'Notebook Event';
        const body = notebook?.description
          ? `${notebook.description}`
          : `Your notebook event of type ${event.type} has been processed.`;

        await this.pushNotificationsService.sendNotificationToUser(event.userId, {
          title,
          body,
        });

        event.status = NotebookEventStatus.EXECUTED;
        await this.eventsRepository.save(event);

        this.logger.log(`Event ${event.id} executed successfully`);
      } catch (error) {
        this.logger.error(`Failed to process event ${event.id}:`, error);
        event.retryCount++;
        if (event.retryCount >= 3) {
          event.status = NotebookEventStatus.FAILED;
        }
        await this.eventsRepository.save(event);
      }
    }
  }
}
