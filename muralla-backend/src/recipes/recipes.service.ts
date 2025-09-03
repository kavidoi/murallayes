import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  // Recipe Management
  async createRecipe(data: Prisma.RecipeCreateInput) {
    return this.prisma.recipe.create({
      data,
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        variants: true
      }
    });
  }

  async findRecipesByProduct(productId: string) {
    return this.prisma.recipe.findMany({
      where: { 
        productId,
        isDeleted: false 
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        variants: true
      }
    });
  }

  async addIngredientToRecipe(recipeId: string, ingredientData: Prisma.RecipeIngredientCreateInput) {
    return this.prisma.recipeIngredient.create({
      data: {
        ...ingredientData,
        recipeId
      },
      include: {
        ingredient: true
      }
    });
  }

  // Product Variants
  async createProductVariant(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({
      data,
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        }
      }
    });
  }

  async getProductVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { 
        productId,
        isDeleted: false,
        isActive: true
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  // Ingredient Usage Tracking
  async recordIngredientUsage(data: Prisma.IngredientUsageCreateInput) {
    return this.prisma.ingredientUsage.create({
      data,
      include: {
        ingredient: true,
        product: true,
        variant: true
      }
    });
  }

  async processProductSale(productId: string, variantId: string | null, quantity: number, soldBy: string) {
    // Get the recipe for the product/variant
    const recipe = variantId 
      ? await this.prisma.recipe.findFirst({
          where: { 
            variants: { some: { id: variantId } }
          },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        })
      : await this.prisma.recipe.findFirst({
          where: { 
            productId,
            isDefault: true 
          },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        });

    if (!recipe) {
      throw new Error('No recipe found for this product/variant');
    }

    // Record ingredient usage for each ingredient in the recipe
    const usageRecords = [];
    for (const recipeIngredient of recipe.ingredients) {
      const totalQuantityUsed = recipeIngredient.quantity.toNumber() * quantity;
      
      // Get current cost of ingredient
      const ingredient = await this.prisma.product.findUnique({
        where: { id: recipeIngredient.ingredientId }
      });

      const usageRecord = await this.recordIngredientUsage({
        ingredientId: recipeIngredient.ingredientId,
        productId,
        variantId,
        quantity: totalQuantityUsed,
        unit: recipeIngredient.unit,
        cost: ingredient?.unitCost || null,
        createdBy: soldBy
      });

      // Update ingredient stock
      await this.prisma.product.update({
        where: { id: recipeIngredient.ingredientId },
        data: {
          stock: {
            decrement: Math.ceil(totalQuantityUsed) // Round up to ensure we don't oversell
          }
        }
      });

      usageRecords.push(usageRecord);
    }

    return usageRecords;
  }

  // Projected Inventory Calculations
  async calculateProjectedInventory(productId: string, variantId?: string) {
    // Get the recipe
    const recipe = variantId 
      ? await this.prisma.recipe.findFirst({
          where: { 
            variants: { some: { id: variantId } }
          },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        })
      : await this.prisma.recipe.findFirst({
          where: { 
            productId,
            isDefault: true 
          },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        });

    if (!recipe || recipe.ingredients.length === 0) {
      return { canMake: 0, limitingIngredient: null };
    }

    // Calculate how many units we can make based on each ingredient
    let minPossible = Infinity;
    let limitingIngredient = null;

    for (const recipeIngredient of recipe.ingredients) {
      if (recipeIngredient.isOptional) continue;

      const availableStock = recipeIngredient.ingredient.stock;
      const requiredPerUnit = recipeIngredient.quantity.toNumber();
      const possibleFromThisIngredient = Math.floor(availableStock / requiredPerUnit);

      if (possibleFromThisIngredient < minPossible) {
        minPossible = possibleFromThisIngredient;
        limitingIngredient = {
          id: recipeIngredient.ingredient.id,
          name: recipeIngredient.ingredient.name,
          available: availableStock,
          required: requiredPerUnit
        };
      }
    }

    return {
      canMake: minPossible === Infinity ? 0 : minPossible,
      limitingIngredient,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients.map(ri => ({
          id: ri.ingredient.id,
          name: ri.ingredient.name,
          required: ri.quantity.toNumber(),
          available: ri.ingredient.stock,
          unit: ri.unit,
          isOptional: ri.isOptional
        }))
      }
    };
  }

  async getProjectedInventoryForAllRecipeProducts() {
    // Get all products that have recipes
    const productsWithRecipes = await this.prisma.product.findMany({
      where: {
        recipes: {
          some: {}
        },
        isDeleted: false
      },
      include: {
        recipes: {
          where: { isDeleted: false },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        },
        variants: {
          where: { isDeleted: false, isActive: true }
        }
      }
    });

    const projections = [];

    for (const product of productsWithRecipes) {
      // Calculate for default recipe
      const defaultRecipe = product.recipes.find(r => r.isDefault) || product.recipes[0];
      if (defaultRecipe) {
        const projection = await this.calculateProjectedInventory(product.id);
        projections.push({
          productId: product.id,
          productName: product.name,
          variantId: null,
          variantName: null,
          ...projection
        });
      }

      // Calculate for each variant
      for (const variant of product.variants) {
        const projection = await this.calculateProjectedInventory(product.id, variant.id);
        projections.push({
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: variant.name,
          ...projection
        });
      }
    }

    return projections;
  }

  // Analytics and Statistics
  async getIngredientUsageStats(ingredientId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.IngredientUsageWhereInput = {
      ingredientId
    };

    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) where.usedAt.gte = startDate;
      if (endDate) where.usedAt.lte = endDate;
    }

    const usage = await this.prisma.ingredientUsage.findMany({
      where,
      include: {
        product: true,
        variant: true
      },
      orderBy: { usedAt: 'desc' }
    });

    const totalQuantity = usage.reduce((sum, u) => sum + u.quantity.toNumber(), 0);
    const totalCost = usage.reduce((sum, u) => sum + (u.cost?.toNumber() || 0), 0);

    const byProduct = usage.reduce((acc, u) => {
      const key = u.variantId ? `${u.product.name} - ${u.variant?.name}` : u.product.name;
      if (!acc[key]) {
        acc[key] = { quantity: 0, cost: 0, count: 0 };
      }
      acc[key].quantity += u.quantity.toNumber();
      acc[key].cost += u.cost?.toNumber() || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { quantity: number; cost: number; count: number }>);

    return {
      totalQuantity,
      totalCost,
      usageCount: usage.length,
      byProduct,
      recentUsage: usage.slice(0, 10) // Last 10 uses
    };
  }

  async getProRataReport(startDate: Date, endDate: Date) {
    const usage = await this.prisma.ingredientUsage.findMany({
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        ingredient: true,
        product: true,
        variant: true
      }
    });

    const report = usage.reduce((acc, u) => {
      const ingredientKey = u.ingredient.name;
      const productKey = u.variantId ? `${u.product.name} - ${u.variant?.name}` : u.product.name;

      if (!acc[ingredientKey]) {
        acc[ingredientKey] = {
          totalQuantity: 0,
          totalCost: 0,
          products: {}
        };
      }

      if (!acc[ingredientKey].products[productKey]) {
        acc[ingredientKey].products[productKey] = {
          quantity: 0,
          cost: 0,
          percentage: 0
        };
      }

      const quantity = u.quantity.toNumber();
      const cost = u.cost?.toNumber() || 0;

      acc[ingredientKey].totalQuantity += quantity;
      acc[ingredientKey].totalCost += cost;
      acc[ingredientKey].products[productKey].quantity += quantity;
      acc[ingredientKey].products[productKey].cost += cost;

      return acc;
    }, {} as Record<string, any>);

    // Calculate percentages
    Object.keys(report).forEach(ingredientKey => {
      const ingredient = report[ingredientKey];
      Object.keys(ingredient.products).forEach(productKey => {
        const product = ingredient.products[productKey];
        product.percentage = ingredient.totalQuantity > 0 
          ? (product.quantity / ingredient.totalQuantity) * 100 
          : 0;
      });
    });

    return report;
  }
}
