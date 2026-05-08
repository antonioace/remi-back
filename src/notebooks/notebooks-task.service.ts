import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotebookEvent,
  NotebookEventStatus,
  NotebookEventType,
} from './entities/notebook-event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notebook } from './entities/notebook.entity';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { NotebookSchedule } from './entities/notebook-schedule.entity';

@Injectable()
export class NotebooksTaskService {
  private readonly logger = new Logger(NotebooksTaskService.name);

  constructor(
    @InjectRepository(Notebook)
    private readonly notebookRepository: Repository<Notebook>,
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    @InjectRepository(NotebookSchedule)
    private readonly schedulesRepository: Repository<NotebookSchedule>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Run every 20 seconds
  @Cron('*/20 * * * * *')
  async handleCron() {
    this.logger.debug('Running cron job to process pending notebook events');

    const now = new Date();
    const pendingEvents = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect(Notebook, 'notebook', 'notebook.id = event.notebookId')
      .where('event.status = :status', { status: NotebookEventStatus.PENDING })
      .andWhere(
        '((event.assignedAt IS NULL AND notebook.assignedAt IS NULL) OR COALESCE(event.assignedAt, notebook.assignedAt) <= :now)',
        { now },
      )
      .addSelect(
        'COALESCE(event.assignedAt, notebook.assignedAt, event.createdAt)',
        'sortDate',
      )
      .orderBy('sortDate', 'ASC')
      .take(10)
      .getMany();

    for (const event of pendingEvents) {
      try {
        this.logger.log(`Processing event ${event.id} of type ${event.type}`);

        const notebook = await this.notebookRepository.findOne({
          where: { id: event.notebookId },
        });

        // 1. Determine Title and Message (prefer Schedule data, fallback to Notebook data)
        let title = notebook?.name || 'Notebook Event';
        let message =
          notebook?.description || 'Your scheduled event has been triggered.';

        if (event.scheduleId) {
          const schedule = await this.schedulesRepository.findOne({
            where: { id: event.scheduleId },
          });
          if (schedule) {
            title = schedule.name;
            if (schedule.description) message = schedule.description;
          }
        }

        // 1. Send Notifications based on Channels
        if (event.channels && event.channels.length > 0) {
          if (event.channels.includes('push')) {
            await this.pushNotificationsService.sendNotificationToUser(
              event.userId,
              {
                title,
                body: message,
              },
            );
          }

          if (event.channels.includes('email')) {
            try {
              const user = await this.usersService.findOne(event.userId);
              await this.emailService.sendEmail(
                user.email,
                title,
                message,
                `<p>${message}</p>`,
              );
            } catch (e) {
              this.logger.error(
                `Failed to send email to user ${event.userId}`,
                e,
              );
            }
          }

          // Internal notification system is always used for audit/history in this app
          await this.notificationsService.create(event.userId, {
            title,
            message,
          });
        } else {
          await this.notificationsService.create(event.userId, {
            title,
            message,
          });
        }

        // 2. Update Status
        event.status = NotebookEventStatus.EXECUTED;
        await this.eventsRepository.save(event);

        // 3. Emit Execution Event for Schedules
        if (event.type === NotebookEventType.SCHEDULED && event.scheduleId) {
          this.eventEmitter.emit('schedule.executed', {
            scheduleId: event.scheduleId,
            lastExecutionDate: event.assignedAt || now,
            isRecurrent: event.isRecurrent,
            interval: event.interval,
          });
        }

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
