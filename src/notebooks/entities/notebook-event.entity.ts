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
}

export enum NotebookEventType {
  CREATED = 'created',
  UPDATED = 'updated',
}

@Entity('notebook_events')
export class NotebookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notebookId: string;

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

  @Column('json', { nullable: true })
  payload?: Record<string, unknown>;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
