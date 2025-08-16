import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CostsService } from './costs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import type {} from '../prisma-v6-compat';
import { CreateCostDto } from './dto/create-cost.dto';
import { ListCostsQueryDto } from './dto/list-costs.dto';
import { LinkTransactionDto } from './dto/link-transaction.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'staff')
@Controller('costs')
export class CostsController {
  constructor(private readonly costs: CostsService) {}

  @Post()
  create(@Body() dto: CreateCostDto) {
    return this.costs.createCost(dto);
  }

  @Get()
  list(@Query() q: ListCostsQueryDto) {
    return this.costs.listCosts(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.costs.getCost(id);
  }

  @Post(':id/link-transaction')
  link(@Param('id') costId: string, @Body() dto: LinkTransactionDto) {
    return this.costs.linkTransaction(costId, dto.transactionId);
  }
}
