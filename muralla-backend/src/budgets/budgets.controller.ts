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
  Request,
} from '@nestjs/common';
import { BudgetsService, CreateBudgetDto, UpdateBudgetDto, CreateCommentDto } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import type {} from '../prisma-v6-compat';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'staff')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() createBudgetDto: CreateBudgetDto, @Request() req: any) {
    return this.budgetsService.create(createBudgetDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.budgetsService.findAll({ projectId, status, category });
  }

  @Get('variance-report')
  getVarianceReport(@Query('budgetId') budgetId?: string) {
    return this.budgetsService.getVarianceReport(budgetId);
  }

  @Get('alerts')
  getBudgetAlerts(@Query('budgetId') budgetId?: string) {
    return this.budgetsService.getBudgetAlerts(budgetId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto) {
    return this.budgetsService.update(id, updateBudgetDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }

  @Post(':budgetLineId/create-tasks')
  @Roles('admin', 'manager')
  createTasksFromBudgetLine(
    @Param('budgetLineId') budgetLineId: string,
    @Request() req: any
  ) {
    return this.budgetsService.createTasksFromBudgetLine(budgetLineId, req.user.userId);
  }

  @Post('comments')
  addComment(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
    return this.budgetsService.addComment(createCommentDto, req.user.userId);
  }
}
