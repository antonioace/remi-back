import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(userId: string, dto: CreateNotificationDto) {
    const notification = this.notificationsRepository.create({
      ...dto,
      userId,
      readAt: null,
    });
    return this.notificationsRepository.save(notification);
  }

  async findAllByUser(userId: string) {
    return this.notificationsRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return notification;
  }

  async update(userId: string, id: string, dto: UpdateNotificationDto) {
    const notification = await this.findOne(userId, id);
    Object.assign(notification, dto);
    return this.notificationsRepository.save(notification);
  }

  async remove(userId: string, id: string) {
    const result = await this.notificationsRepository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException('Notificación no encontrada');
    }
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.findOne(userId, id);
    notification.readAt = new Date();
    return this.notificationsRepository.save(notification);
  }
}
