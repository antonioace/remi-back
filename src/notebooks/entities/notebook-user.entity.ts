import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notebook } from './notebook.entity';

@Entity('notebook_user')
export class NotebookUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notebookId: string;

  @ManyToOne(() => Notebook)
  @JoinColumn({ name: 'notebookId' })
  notebook: Notebook;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
