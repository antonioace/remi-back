import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotebooksService } from './notebooks.service';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('notebooks')
@UseGuards(JwtAuthGuard)
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Post()
  create(@Body() createNotebookDto: CreateNotebookDto) {
    return this.notebooksService.create(createNotebookDto);
  }

  @Post('create-audio')
  @UseInterceptors(FileInterceptor('file'))
  async createFromAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('timezone') timezone: string,
    @Request() req: { user: { userId: string } },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!timezone) throw new BadRequestException('Timezone is required');

    return this.notebooksService.createFromAudio(
      file,
      req.user.userId,
      timezone,
    );
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.notebooksService.findAll(paginationDto, req?.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notebooksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotebookDto: UpdateNotebookDto,
  ) {
    return this.notebooksService.update(id, updateNotebookDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notebooksService.remove(id);
  }
}
