import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notebook } from '../entities/notebook.entity';
import {
  NotebookEvent,
  NotebookEventType,
  NotebookEventStatus,
} from '../entities/notebook-event.entity';
import {
  NotebookSchedule,
  ScheduleType,
  ScheduleStatus,
} from '../entities/notebook-schedule.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import dayjs from 'dayjs';

@Injectable()
export class NotebooksListener {
  private readonly logger = new Logger(NotebooksListener.name);

  constructor(
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    @InjectRepository(NotebookSchedule)
    private readonly schedulesRepository: Repository<NotebookSchedule>,
    private readonly notificationService: NotificationsService,
  ) {}

  @OnEvent('notebook.created')
  async handleNotebookCreatedEvent(notebook: Notebook) {
    this.logger.log(`Handling notebook.created for ${notebook.id}`);
    await this.notificationService.create(notebook.userId, {
      title: 'Nota creada',
      message: `Tu nota "${notebook.name}" ha sido creada.`,
    });
    await this.createNotebookEvent(notebook, NotebookEventType.CREATED);
  }

  @OnEvent('notebook.updated')
  async handleNotebookUpdatedEvent(notebook: Notebook) {
    this.logger.log(`Handling notebook.updated for ${notebook.id}`);

    await this.notificationService.create(notebook.userId, {
      title: 'Nota actualizada',
      message: `Tu nota "${notebook.name}" ha sido actualizada.`,
    });

    const lastEvent = await this.eventsRepository.findOne({
      where: { notebookId: notebook.id },
      order: { createdAt: 'DESC' },
    });

    const oldAssignedAt = lastEvent?.payload?.assignedAt;
    const oldDate = oldAssignedAt
      ? new Date(oldAssignedAt as string).getTime()
      : undefined;
    const newDate = notebook?.assignedAt
      ? new Date(notebook?.assignedAt).getTime()
      : undefined;

    if (oldDate !== newDate) {
      await this.createNotebookEvent(notebook, NotebookEventType.UPDATED);
    }
  }

  @OnEvent('schedule.created')
  @OnEvent('schedule.updated')
  async handleScheduleSyncEvent(schedule: NotebookSchedule) {
    this.logger.log(`Syncing event for schedule ${schedule.id}`);
    await this.syncScheduleEvent(schedule);
  }

  @OnEvent('schedule.deleted')
  async handleScheduleDeletedEvent(schedule: NotebookSchedule) {
    this.logger.log(`Canceling events for deleted schedule ${schedule.id}`);
    await this.eventsRepository.update(
      {
        scheduleId: schedule.id,
        status: NotebookEventStatus.PENDING,
      },
      { status: NotebookEventStatus.CANCELED },
    );
  }

  @OnEvent('schedule.executed')
  async handleScheduleExecutedEvent(payload: {
    scheduleId: string;
    lastExecutionDate: Date;
    isRecurrent: boolean;
    interval?: { days: number; hours: number; minutes: number };
  }) {
    const { scheduleId, lastExecutionDate, isRecurrent, interval } = payload;
    const schedule = await this.schedulesRepository.findOne({
      where: { id: scheduleId },
    });
    if (!schedule || !schedule.isEnabled) return;

    // Update last execution date
    schedule.lastExecutionAt = lastExecutionDate;

    if (!isRecurrent) {
      schedule.status = ScheduleStatus.EXECUTED;
      await this.schedulesRepository.save(schedule);
      this.logger.log(`Schedule ${schedule.id} marked as EXECUTED`);
    } else if (isRecurrent && interval) {
      // Save the lastExecutionAt for recurrent too
      await this.schedulesRepository.save(schedule);
      const nextDate = dayjs(lastExecutionDate)
        .add(interval.days || 0, 'day')
        .add(interval.hours || 0, 'hour')
        .add(interval.minutes || 0, 'minute')
        .toDate();

      if (schedule.endDate && nextDate > schedule.endDate) {
        schedule.status = ScheduleStatus.EXECUTED;
        await this.schedulesRepository.save(schedule);
        this.logger.log(`Recurrent schedule ${schedule.id} reached end date`);
        return;
      }

      const nextEvent = this.eventsRepository.create({
        notebookId: schedule.notebookId,
        scheduleId: schedule.id,
        userId: schedule.userId,
        type: NotebookEventType.SCHEDULED,
        status: NotebookEventStatus.PENDING,
        assignedAt: nextDate,
        channels: schedule.channels,
        isRecurrent: true,
        interval: schedule.interval,
        payload: {
          name: schedule.name,
        },
      });
      await this.eventsRepository.save(nextEvent);
      this.logger.log(
        `Scheduled next occurrence for ${schedule.id} at ${nextDate.toISOString()}`,
      );
    }
  }

  private async syncScheduleEvent(schedule: NotebookSchedule) {
    if (!schedule.isEnabled || schedule.status === ScheduleStatus.EXECUTED) {
      await this.eventsRepository.update(
        {
          scheduleId: schedule.id,
          status: NotebookEventStatus.PENDING,
        },
        { status: NotebookEventStatus.CANCELED },
      );
      return;
    }

    const eventDate =
      schedule.type === ScheduleType.NORMAL
        ? schedule.date
        : schedule.startDate;

    let event = await this.eventsRepository.findOne({
      where: {
        scheduleId: schedule.id,
        status: NotebookEventStatus.PENDING,
      },
    });

    if (event) {
      event.assignedAt = eventDate;
      event.userId = schedule.userId;
      event.notebookId = schedule.notebookId;
      event.channels = schedule.channels;
      event.isRecurrent = schedule.type === ScheduleType.RECURRENT;
      event.interval = schedule.interval;
      await this.eventsRepository.save(event);
    } else {
      event = this.eventsRepository.create({
        notebookId: schedule.notebookId,
        scheduleId: schedule.id,
        userId: schedule.userId,
        type: NotebookEventType.SCHEDULED,
        status: NotebookEventStatus.PENDING,
        assignedAt: eventDate,
        channels: schedule.channels,
        isRecurrent: schedule.type === ScheduleType.RECURRENT,
        interval: schedule.interval,
        payload: {
          name: schedule.name,
        },
      });
      await this.eventsRepository.save(event);
    }
  }

  private async createNotebookEvent(
    notebook: Notebook,
    type: NotebookEventType,
  ) {
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
