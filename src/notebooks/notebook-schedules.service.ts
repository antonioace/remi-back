import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotebookSchedule,
  ScheduleStatus,
} from './entities/notebook-schedule.entity';
import { NotebookEvent } from './entities/notebook-event.entity';
import { CreateNotebookScheduleDto } from './dto/create-notebook-schedule.dto';
import { UpdateNotebookScheduleDto } from './dto/update-notebook-schedule.dto';

@Injectable()
export class NotebookSchedulesService {
  private readonly logger = new Logger(NotebookSchedulesService.name);

  constructor(
    @InjectRepository(NotebookSchedule)
    private readonly schedulesRepository: Repository<NotebookSchedule>,
    @InjectRepository(NotebookEvent)
    private readonly eventsRepository: Repository<NotebookEvent>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findEventsByScheduleId(scheduleId: string): Promise<NotebookEvent[]> {
    return this.eventsRepository.find({
      where: { scheduleId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByNotebookId(notebookId: string): Promise<NotebookSchedule[]> {
    return this.schedulesRepository.find({
      where: { notebookId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<NotebookSchedule> {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  async create(
    notebookId: string,
    userId: string,
    dto: CreateNotebookScheduleDto,
  ): Promise<NotebookSchedule> {
    const schedule = this.schedulesRepository.create({
      ...dto,
      notebookId,
      userId,
      date: dto.date ? new Date(dto.date) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      channels: dto.channels ?? [],
      isEnabled: true,
      status: ScheduleStatus.PENDING,
    });

    const saved = await this.schedulesRepository.save(schedule);
    this.logger.log(`Schedule created: ${saved.id} for notebook ${notebookId}`);

    this.eventEmitter.emit('schedule.created', saved);

    return saved;
  }

  async update(
    id: string,
    dto: UpdateNotebookScheduleDto,
  ): Promise<NotebookSchedule> {
    const schedule = await this.findOne(id);

    // Apply updates
    if (dto.name !== undefined) schedule.name = dto.name;
    if (dto.description !== undefined) schedule.description = dto.description;
    if (dto.type !== undefined) schedule.type = dto.type;
    if (dto.status !== undefined) schedule.status = dto.status;
    if (dto.isEnabled !== undefined) schedule.isEnabled = dto.isEnabled;
    if (dto.date !== undefined)
      schedule.date = dto.date ? new Date(dto.date) : undefined;
    if (dto.startDate !== undefined)
      schedule.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    if (dto.endDate !== undefined)
      schedule.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (dto.interval !== undefined) schedule.interval = dto.interval;
    if (dto.channels !== undefined) schedule.channels = dto.channels;

    const saved = await this.schedulesRepository.save(schedule);
    this.logger.log(`Schedule updated: ${saved.id}`);

    this.eventEmitter.emit('schedule.updated', saved);

    return saved;
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.schedulesRepository.remove(schedule);
    this.logger.log(`Schedule deleted: ${id}`);
    this.eventEmitter.emit('schedule.deleted', schedule);
  }
}
