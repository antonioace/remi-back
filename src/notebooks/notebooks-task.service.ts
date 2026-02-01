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

@Injectable()
export class NotebooksTaskService {
  private readonly logger = new Logger(NotebooksTaskService.name);

  constructor(
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Run every 20 seconds
  @Cron('*/20 * * * * *')
  async handleCron() {
    this.logger.debug('Running cron job to process pending notebook events');

    const pendingEvents = await this.eventsRepository.find({
      where: { status: NotebookEventStatus.PENDING },
      take: 10, // Process in batches
    });

    for (const event of pendingEvents) {
      try {
        this.logger.log(`Processing event ${event.id} of type ${event.type}`);

        const notebookName =
          typeof event.payload?.name === 'string'
            ? event.payload.name
            : 'sin nombre';

        await this.notificationsService.create(event.userId, {
          title: `Notebook ${event.type === NotebookEventType.CREATED ? 'Creado' : 'Actualizado'}`,
          message: `Tu notebook "${notebookName}" ha sido procesado exitosamente.`,
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
