import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly s3Service: S3Service,
    ) { }

    async uploadFile(file: Express.Multer.File, userId: string, notebookId?: string) {
        const { key, url } = await this.s3Service.uploadFile(file);

        const newFile = this.fileRepository.create({
            url,
            key,
            userId,
            notebookId: notebookId || undefined,
        });

        return this.fileRepository.save(newFile);
    }

    async getByNotebookId(notebookId: string) {
        return this.fileRepository.find({ where: { notebookId } });
    }
}
