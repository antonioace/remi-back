import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string } },
    @Body('notebookId') notebookId?: string,
  ) {
    return this.filesService.uploadFile(file, req.user.userId, notebookId);
  }

  @Get('notebook/:notebookId')
  @UseGuards(JwtAuthGuard)
  async getFilesByNotebook(@Param('notebookId') notebookId: string) {
    return this.filesService.getByNotebookId(notebookId);
  }
}
