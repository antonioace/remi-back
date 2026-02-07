import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotebooksService } from './notebooks.service';
import { NotebooksController } from './notebooks.controller';
import { Notebook } from './entities/notebook.entity';
import { NotebookEvent } from './entities/notebook-event.entity';
import { NotebooksListener } from './listeners/notebooks.listener';
import { NotebooksTaskService } from './notebooks-task.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notebook, NotebookEvent]),
    NotificationsModule,
    PushNotificationsModule,
  ],
  controllers: [NotebooksController],
  providers: [NotebooksService, NotebooksListener, NotebooksTaskService],
  exports: [NotebooksService],
})
export class NotebooksModule {}
