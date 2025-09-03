import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  async createRecipe(@Body() createRecipeDto: Prisma.RecipeCreateInput) {
    return this.recipesService.createRecipe(createRecipeDto);
  }

  @Get('product/:productId')
  async getProductRecipes(@Param('productId') productId: string) {
    return this.recipesService.findRecipesByProduct(productId);
  }

  @Post(':recipeId/ingredients')
  async addIngredient(
    @Param('recipeId') recipeId: string,
    @Body() ingredientData: Prisma.RecipeIngredientCreateInput
  ) {
    return this.recipesService.addIngredientToRecipe(recipeId, ingredientData);
  }

  @Post('variants')
  async createVariant(@Body() createVariantDto: Prisma.ProductVariantCreateInput) {
    return this.recipesService.createProductVariant(createVariantDto);
  }

  @Get('variants/:productId')
  async getProductVariants(@Param('productId') productId: string) {
    return this.recipesService.getProductVariants(productId);
  }

  @Post('sales/process')
  async processSale(@Body() saleData: {
    productId: string;
    variantId?: string;
    quantity: number;
    soldBy: string;
  }) {
    return this.recipesService.processProductSale(
      saleData.productId,
      saleData.variantId || null,
      saleData.quantity,
      saleData.soldBy
    );
  }

  @Get('inventory/projected/:productId')
  async getProjectedInventory(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string
  ) {
    return this.recipesService.calculateProjectedInventory(productId, variantId);
  }

  @Get('inventory/projected')
  async getAllProjectedInventory() {
    return this.recipesService.getProjectedInventoryForAllRecipeProducts();
  }

  @Get('analytics/ingredient/:ingredientId')
  async getIngredientStats(
    @Param('ingredientId') ingredientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.recipesService.getIngredientUsageStats(ingredientId, start, end);
  }

  @Get('analytics/prorata')
  async getProRataReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.recipesService.getProRataReport(new Date(startDate), new Date(endDate));
  }
}
