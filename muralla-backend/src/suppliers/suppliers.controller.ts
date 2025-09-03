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
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorType } from '@prisma/client';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto, @Request() req) {
    return this.suppliersService.create(createSupplierDto, req.user.tenantId);
  }

  @Get()
  findAll(@Request() req, @Query('type') type?: VendorType, @Query('search') search?: string) {
    if (search) {
      return this.suppliersService.searchSuppliers(search, req.user.tenantId);
    }
    if (type) {
      return this.suppliersService.findByType(type, req.user.tenantId);
    }
    return this.suppliersService.findAll(req.user.tenantId);
  }

  @Public()
  @Get('available-for-supplier')
  getAvailableBrandContacts() {
    // Public endpoint for getting brand contacts - replaces the problematic brands endpoint
    return this.suppliersService.findByType('BRAND_CONTACT', null);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.suppliersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto, @Request() req) {
    return this.suppliersService.update(id, updateSupplierDto, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.suppliersService.remove(id, req.user.tenantId);
  }

  @Post('convert-brand-contact')
  convertBrandContact(
    @Body() body: { brandContactId: string; paymentTerms?: string },
    @Request() req
  ) {
    return this.suppliersService.convertBrandContactToSupplier(
      body.brandContactId,
      body.paymentTerms,
      req.user.tenantId
    );
  }
}
