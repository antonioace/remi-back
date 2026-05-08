import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotebooksService } from './notebooks.service';
import { NotebooksController } from './notebooks.controller';
import { Notebook } from './entities/notebook.entity';
import { NotebookEvent } from './entities/notebook-event.entity';
import { NotebookSchedule } from './entities/notebook-schedule.entity';
import { NotebooksListener } from './listeners/notebooks.listener';
import { NotebooksTaskService } from './notebooks-task.service';
import { NotebookSchedulesService } from './notebook-schedules.service';
import { NotebookSchedulesController } from './notebook-schedules.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { AudioModule } from '../audio/audio.module';
import { OpenaiModule } from '../openai/openai.module';
import { NotebookUser } from './entities/notebook-user.entity';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notebook,
      NotebookEvent,
      NotebookUser,
      NotebookSchedule,
    ]),
    NotificationsModule,
    PushNotificationsModule,
    AudioModule,
    OpenaiModule,
    EmailModule,
    UsersModule,
  ],
  controllers: [NotebooksController, NotebookSchedulesController],
  providers: [
    NotebooksService,
    NotebooksListener,
    NotebooksTaskService,
    NotebookSchedulesService,
  ],
  exports: [NotebooksService],
})
export class NotebooksModule {}
