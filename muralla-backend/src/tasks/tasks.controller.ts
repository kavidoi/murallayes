import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
// Removed Prisma import to avoid runtime reflection on types
import type {} from '../prisma-v6-compat';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'staff')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: any) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('assigneeId') assigneeId?: string) {
    if (projectId) return this.tasksService.findByProject(projectId);
    if (assigneeId) return this.tasksService.findByAssignee(assigneeId);
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: any) {
    return this.tasksService.update(id, updateTaskDto);
  }

  // Create a subtask under a parent task
  @Post(':id/subtasks')
  createSubtask(@Param('id') parentId: string, @Body() dto: any) {
    return this.tasksService.createSubtask(parentId, dto);
  }

  // Update a subtask by subtask id
  @Patch('subtasks/:id')
  updateSubtask(@Param('id') id: string, @Body() dto: any) {
    return this.tasksService.updateSubtask(id, dto);
  }

  // Reorder subtasks under a parent task
  @Patch(':id/subtasks/reorder')
  reorderSubtasks(@Param('id') parentId: string, @Body() body: { subtaskIds: string[] }) {
    return this.tasksService.reorderSubtasks(parentId, body.subtaskIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
