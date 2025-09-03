import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('entities')
  async searchEntities(
    @GetUser() user: any,
    @Query('type') type: string,
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.searchService.searchEntities(type, query, limitNum, user.tenantId);
  }

  @Get('global')
  async globalSearch(
    @GetUser() user: any,
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.searchService.globalSearch(query, limitNum, user.tenantId);
  }

  @Get('relationships')
  async searchRelationships(
    @GetUser() user: any,
    @Query('sourceType') sourceType: string,
    @Query('sourceId') sourceId: string,
    @Query('targetType') targetType?: string,
    @Query('relationshipType') relationshipType?: string,
  ) {
    return this.searchService.searchRelationships(
      sourceType,
      sourceId,
      targetType,
      relationshipType,
      user.tenantId,
    );
  }
}