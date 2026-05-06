import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { Notebook } from './entities/notebook.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { AudioService } from '../audio/audio.service';
import { OpenaiService } from '../openai/openai.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

interface NotebookAIResponse {
  name: string;
  description: string;
  textContent: string;
  assignedAt: string | null;
}

@Injectable()
export class NotebooksService {
  private readonly logger = new Logger(NotebooksService.name);

  constructor(
    @InjectRepository(Notebook)
    private readonly notebooksRepository: Repository<Notebook>,
    private readonly eventEmitter: EventEmitter2,
    private readonly audioService: AudioService,
    private readonly openaiService: OpenaiService,
  ) {}

  async create(createNotebookDto: CreateNotebookDto) {
    const notebook = this.notebooksRepository.create(createNotebookDto);
    const savedNotebook = await this.notebooksRepository.save(notebook);
    this.eventEmitter.emit('notebook.created', savedNotebook);
    return savedNotebook;
  }

  async createFromAudio(
    file: Express.Multer.File,
    userId: string,
    timezone: string,
  ) {
    // 1. Upload and Transcribe
    const audio = await this.audioService.uploadAndTranscribe(file, userId);

    if (!audio.transcription) {
      throw new Error('No transcription available for this audio');
    }

    // 2. Process with OpenAI
    const prompt = `Analiza la siguiente transcripción y extrae la información para crear una nota.
    Devuelve un JSON con:
    - name: Título corto.
    - description: Resumen breve.
    - textContent: Contenido detallado.
    - assignedAt: Fecha y hora para la tarea en formato "YYYY-MM-DD HH:mm". Si menciona "mañana", "lunes", etc, calcula la fecha basándote en que hoy es ${dayjs().tz(timezone).format('YYYY-MM-DD HH:mm')}.
    
    Transcripción: "${audio.transcription}"`;

    const jsonStructure = `{
        "name": "string",
        "description": "string",
        "textContent": "string",
        "assignedAt": "string (YYYY-MM-DD HH:mm) or null"
    }`;

    const aiResult = await this.openaiService.generateJSON(
      prompt,
      jsonStructure,
      timezone,
    );

    if (!aiResult.success || !aiResult.response) {
      throw new Error('Failed to analyze audio');
    }

    let parsedData: NotebookAIResponse;
    try {
      parsedData = JSON.parse(aiResult.response) as NotebookAIResponse;
    } catch (e: any) {
      this.logger.error('Error parsing OpenAI response', e);
      // Fallback
      parsedData = {
        name: 'Audio Note',
        description: 'Created from audio',
        textContent: audio.transcription,
        assignedAt: null,
      };
    }

    // 3. Create Notebook
    let assignedDate: Date | undefined = undefined;
    if (parsedData.assignedAt) {
      assignedDate = dayjs
        .tz(parsedData.assignedAt, 'YYYY-MM-DD HH:mm', timezone)
        .toDate();
    }

    const notebook = this.notebooksRepository.create({
      name: parsedData.name || 'Audio Note',
      description: parsedData.description,
      textContent: parsedData.textContent || audio.transcription,
      assignedAt: assignedDate,
      userId: userId,
      timezone: timezone,
    });

    const savedNotebook = await this.notebooksRepository.save(notebook);

    // 4. Link Audio
    await this.audioService.setNotebookId(audio.id, savedNotebook.id);

    this.eventEmitter.emit('notebook.created', savedNotebook);

    return savedNotebook;
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
  ): Promise<PaginationResult<Notebook>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notebooksRepository.findAndCount({
      take: limit,
      skip,
      where: { userId },
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
