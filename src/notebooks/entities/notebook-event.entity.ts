import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotebookEventStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum NotebookEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  SCHEDULED = 'scheduled',
}

@Entity('notebook_events')
export class NotebookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notebookId: string;

  @Column({ nullable: true })
  scheduleId?: string;

  // SQLite (better-sqlite3) does not support timestamptz; use datetime instead
  @Column({ type: 'datetime', nullable: true })
  assignedAt?: Date;

  @Column({
    type: 'simple-enum',
    enum: NotebookEventType,
  })
  type: NotebookEventType;

  @Column({
    type: 'simple-enum',
    enum: NotebookEventStatus,
    default: NotebookEventStatus.PENDING,
  })
  status: NotebookEventStatus;

  @Column()
  userId: string;

  @Column('json', { default: '[]' })
  channels: string[];

  @Column({ default: false })
  isRecurrent: boolean;

  @Column('json', { nullable: true })
  interval?: { days: number; hours: number; minutes: number };

  @Column('json', { nullable: true })
  payload?: Record<string, unknown>;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
