import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Body,
  BadRequestException,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AudioService } from './audio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string } },
    @Body('notebookId') notebookId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.audioService.uploadAndTranscribe(
      file,
      req.user.userId,
      notebookId,
    );
  }
  @Get('notebook/:notebookId')
  @UseGuards(JwtAuthGuard)
  async getAudioByNotebook(@Param('notebookId') notebookId: string) {
    return this.audioService.getByNotebookId(notebookId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAudio(@Param('id') id: string) {
    return this.audioService.deleteAudio(id);
  }
}
