import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/entities/file.entity';
import { Audio } from '../../audio/entities/audio.entity';
import { NotebookUser } from './notebook-user.entity';

@Entity('notebooks')
export class Notebook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('text')
  textContent: string;

  @Column('json', { nullable: true })
  content?: Record<string, unknown>;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  assignedAt?: Date;

  @Column({ nullable: true })
  timezone?: string;

  @OneToMany(() => File, (file) => file.notebook)
  files: File[];

  @OneToMany(() => Audio, (audio) => audio.notebook)
  audios: Audio[];

  @OneToMany(() => NotebookUser, (notebookUser) => notebookUser.notebook)
  notebookUsers: NotebookUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
