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
  SetMetadata,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandContactDto } from './dto/create-brand-contact.dto';
import { UpdateBrandContactDto } from './dto/update-brand-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBrandDto: CreateBrandDto, @Request() req) {
    return this.brandsService.create(createBrandDto, req.user.tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req, @Query('search') search?: string) {
    if (search) {
      return this.brandsService.searchBrands(search, req.user.tenantId);
    }
    return this.brandsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.brandsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto, @Request() req) {
    return this.brandsService.update(id, updateBrandDto, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.brandsService.remove(id, req.user.tenantId);
  }

  // Brand Contacts
  @Post('contacts')
  createContact(@Body() createBrandContactDto: CreateBrandContactDto, @Request() req) {
    return this.brandsService.createContact(createBrandContactDto, req.user.tenantId);
  }

  // Removed: Use /suppliers?type=BRAND_CONTACT instead

  @Get(':brandId/contacts')
  findAllContacts(@Param('brandId') brandId: string, @Request() req) {
    return this.brandsService.findAllContacts(brandId, req.user.tenantId);
  }

  @Get('contacts/:id')
  findOneContact(@Param('id') id: string, @Request() req) {
    return this.brandsService.findOneContact(id, req.user.tenantId);
  }

  @Patch('contacts/:id')
  updateContact(@Param('id') id: string, @Body() updateBrandContactDto: UpdateBrandContactDto, @Request() req) {
    return this.brandsService.updateContact(id, updateBrandContactDto, req.user.tenantId);
  }

  @Delete('contacts/:id')
  removeContact(@Param('id') id: string, @Request() req) {
    return this.brandsService.removeContact(id, req.user.tenantId);
  }
}
