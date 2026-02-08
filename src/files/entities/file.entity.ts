import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notebook } from '../../notebooks/entities/notebook.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  key: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  notebookId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Notebook, (notebook) => notebook.files, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'notebookId' })
  notebook: Notebook;
}
