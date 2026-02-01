import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { Notebook } from './entities/notebook.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';

@Injectable()
export class NotebooksService {
  constructor(
    @InjectRepository(Notebook)
    private readonly notebooksRepository: Repository<Notebook>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createNotebookDto: CreateNotebookDto) {
    const notebook = this.notebooksRepository.create(createNotebookDto);
    const savedNotebook = await this.notebooksRepository.save(notebook);
    this.eventEmitter.emit('notebook.created', savedNotebook);
    return savedNotebook;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Notebook>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notebooksRepository.findAndCount({
      take: limit,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findOne(id: string) {
    const notebook = await this.notebooksRepository.findOneBy({ id });
    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${id} not found`);
    }
    return notebook;
  }

  async update(id: string, updateNotebookDto: UpdateNotebookDto) {
    const notebook = await this.findOne(id);
    Object.assign(notebook, updateNotebookDto);
    const savedNotebook = await this.notebooksRepository.save(notebook);
    this.eventEmitter.emit('notebook.updated', savedNotebook);
    return savedNotebook;
  }

  async remove(id: string) {
    const notebook = await this.findOne(id);
    return this.notebooksRepository.remove(notebook);
  }
}
