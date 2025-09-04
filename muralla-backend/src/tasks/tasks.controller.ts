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

  // Reorder top-level tasks
  @Patch('reorder')
  reorderTasks(@Body() body: { taskIds: string[] }) {
    return this.tasksService.reorderTasks(body.taskIds);
  }

  // Manage task assignees
  @Patch(':id/assignees')
  updateTaskAssignees(@Param('id') taskId: string, @Body() body: { userIds: string[] }) {
    console.log('TasksController.updateTaskAssignees called:', { taskId, body });
    console.log('Body type:', typeof body, 'userIds:', body.userIds, 'userIds type:', typeof body.userIds);
    return this.tasksService.updateTaskAssignees(taskId, body.userIds);
  }

  @Post(':id/assignees')
  addTaskAssignee(@Param('id') taskId: string, @Body() body: { userId: string; role?: string }) {
    return this.tasksService.addTaskAssignee(taskId, body.userId, body.role || 'assignee');
  }

  @Delete(':id/assignees/:userId')
  removeTaskAssignee(@Param('id') taskId: string, @Param('userId') userId: string) {
    return this.tasksService.removeTaskAssignee(taskId, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
