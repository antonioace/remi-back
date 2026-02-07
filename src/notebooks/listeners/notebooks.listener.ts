import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notebook } from '../entities/notebook.entity';
import {
  NotebookEvent,
  NotebookEventType,
  NotebookEventStatus,
} from '../entities/notebook-event.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class NotebooksListener {
  private readonly logger = new Logger(NotebooksListener.name);

  constructor(
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    private readonly notificationService: NotificationsService
  ) { }

  @OnEvent('notebook.created')
  async handleNotebookCreatedEvent(notebook: Notebook) {
    this.logger.log(`Handling notebook.created for ${notebook.id}`);
    await this.notificationService.create(notebook.userId, {
      title: 'Nota creada',
      message: `Tu nota "${notebook.name}" ha sido creada.`,
    });
    await this.createEvent(notebook, NotebookEventType.CREATED);
  }

  @OnEvent('notebook.updated')
  async handleNotebookUpdatedEvent(notebook: Notebook) {
    this.logger.log(`Handling notebook.updated for ${notebook.id}`);
    await this.notificationService.create(notebook.userId, {
      title: 'Nota actualizada',
      message: `Tu nota "${notebook.name}" ha sido actualizada.`,
    });
    await this.createEvent(notebook, NotebookEventType.UPDATED);
  }

  private async createEvent(notebook: Notebook, type: NotebookEventType) {
    const event = this.eventsRepository.create({
      notebookId: notebook.id,
      userId: notebook.userId,
      type,
      status: NotebookEventStatus.PENDING,
      payload: {
        name: notebook.name,
        assignedAt: notebook.assignedAt,
        timezone: notebook.timezone,
      },
    });
    await this.eventsRepository.save(event);
  }
}
