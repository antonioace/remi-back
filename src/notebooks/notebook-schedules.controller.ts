import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotebookSchedulesService } from './notebook-schedules.service';
import { CreateNotebookScheduleDto } from './dto/create-notebook-schedule.dto';
import { UpdateNotebookScheduleDto } from './dto/update-notebook-schedule.dto';

@Controller('notebook-schedules')
@UseGuards(JwtAuthGuard)
export class NotebookSchedulesController {
  constructor(private readonly schedulesService: NotebookSchedulesService) {}

  @Get('notebook/:notebookId')
  findByNotebook(@Param('notebookId', ParseUUIDPipe) notebookId: string) {
    return this.schedulesService.findByNotebookId(notebookId);
  }

  @Get(':id/events')
  findEvents(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.findEventsByScheduleId(id);
  }

  @Post('notebook/:notebookId')
  create(
    @Param('notebookId', ParseUUIDPipe) notebookId: string,
    @Body() dto: CreateNotebookScheduleDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.schedulesService.create(notebookId, req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotebookScheduleDto,
  ) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.remove(id);
  }
}
