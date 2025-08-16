import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { WorkOrdersService } from './workorders.service';
import { CreateWorkOrderDto } from './dto/create-workorder.dto';
import { UpdateWorkOrderDto } from './dto/update-workorder.dto';
import { WorkOrderFiltersDto } from './dto/workorder-filters.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('workorders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() createWorkOrderDto: CreateWorkOrderDto, @Request() req: any) {
    return this.workOrdersService.create(createWorkOrderDto, req.user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  findAll(@Query() filters: WorkOrderFiltersDto) {
    return this.workOrdersService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateWorkOrderDto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  @Post(':id/start')
  @Roles('admin', 'manager', 'staff')
  startProduction(@Param('id') id: string, @Request() req: any) {
    return this.workOrdersService.startProduction(id, req.user.id);
  }

  @Post(':id/complete')
  @Roles('admin', 'manager', 'staff')
  completeProduction(
    @Param('id') id: string,
    @Body() body: { actualQuantity?: number },
    @Request() req: any,
  ) {
    return this.workOrdersService.completeProduction(id, req.user.id, body.actualQuantity);
  }

  @Post(':id/components')
  @Roles('admin', 'manager', 'staff')
  addComponent(
    @Param('id') workOrderId: string,
    @Body() body: { componentId: string; quantity: number },
    @Request() req: any,
  ) {
    return this.workOrdersService.addComponent(
      workOrderId,
      body.componentId,
      body.quantity,
      req.user.id,
    );
  }

  @Get(':id/components')
  @Roles('admin', 'manager', 'staff')
  getComponents(@Param('id') workOrderId: string) {
    return this.workOrdersService.getComponents(workOrderId);
  }

  @Get(':id/cost')
  @Roles('admin', 'manager')
  calculateCost(@Param('id') id: string) {
    return this.workOrdersService.calculateCost(id);
  }

  @Get('metrics/production')
  @Roles('admin', 'manager')
  getProductionMetrics(@Query() filters: any) {
    return this.workOrdersService.getProductionMetrics(filters);
  }
}
