import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ScheduleType {
  NORMAL = 'normal',
  RECURRENT = 'recurrent',
}

export enum ScheduleStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
}

@Entity('notebook_schedules')
export class NotebookSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notebookId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'simple-enum',
    enum: ScheduleType,
    default: ScheduleType.NORMAL,
  })
  type: ScheduleType;

  @Column({
    type: 'simple-enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.PENDING,
  })
  status: ScheduleStatus;

  @Column({ default: true })
  isEnabled: boolean;

  // For normal type: single fire date
  @Column({ type: 'datetime', nullable: true })
  date?: Date;

  // For recurrent type: range
  @Column({ type: 'datetime', nullable: true })
  startDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date;

  // For recurrent type: interval between executions
  @Column('json', { nullable: true })
  interval?: { days: number; hours: number; minutes: number };

  // Notification channels: "push", "email"
  @Column('json', { default: '[]' })
  channels: string[];

  @Column({ type: 'datetime', nullable: true })
  lastExecutionAt?: Date;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
