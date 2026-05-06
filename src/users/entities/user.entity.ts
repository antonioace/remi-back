import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import { Notebook } from '../../notebooks/entities/notebook.entity';
import { File } from '../../files/entities/file.entity';
import { Audio } from '../../audio/entities/audio.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ nullable: true, unique: true })
  username?: string;

  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Notebook, (notebook) => notebook.user)
  notebooks: Notebook[];

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => Audio, (audio) => audio.user)
  audios: Audio[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
