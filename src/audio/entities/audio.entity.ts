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

@Entity('audios')
export class Audio {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    url: string;

    @Column()
    key: string;

    @Column('text', { nullable: true })
    transcription: string;

    @Column()
    userId: string;

    @Column({ nullable: true })
    notebookId: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.audios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Notebook, (notebook) => notebook.audios, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'notebookId' })
    notebook: Notebook;

    @Column({ default: true })
    isActive: boolean;

}
