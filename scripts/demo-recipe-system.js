#!/usr/bin/env node

/**
 * Recipe System Demo Script
 * 
 * This script demonstrates the complete recipe-based product system implementation
 * for the Muralla inventory management platform. It showcases:
 * 
 * 1. Recipe creation with ingredient tracking
 * 2. Product variants for different recipe configurations
 * 3. Projected inventory calculations based on available ingredients
 * 4. Real-time ingredient consumption tracking
 * 5. Sales processing with automatic stock decrements
 * 6. Analytics and pro-rata usage reports
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Demo data
const DEMO_DATA = {
  // Ingredients (INSUMO products)
  ingredients: [
    { name: 'Coffee Beans - Colombian', stock: 5000, unit: 'g', unitCost: 0.015 },
    { name: 'Coffee Beans - Ethiopian', stock: 3000, unit: 'g', unitCost: 0.018 },
    { name: 'Milk', stock: 2000, unit: 'ml', unitCost: 0.002 },
    { name: 'Sugar', stock: 1000, unit: 'g', unitCost: 0.001 },
    { name: 'Vanilla Syrup', stock: 500, unit: 'ml', unitCost: 0.01 },
    { name: 'Cocoa Powder', stock: 800, unit: 'g', unitCost: 0.005 }
  ],
  
  // Finished products (TERMINADO)
  products: [
    { name: 'Espresso Coffee', type: 'TERMINADO', category: 'Beverages' },
    { name: 'Cappuccino', type: 'TERMINADO', category: 'Beverages' },
    { name: 'Mocha Latte', type: 'TERMINADO', category: 'Beverages' }
  ],
  
  // Recipes with ingredient requirements
  recipes: [
    {
      productName: 'Espresso Coffee',
      name: 'Classic Espresso',
      difficulty: 'EASY',
      servingSize: 1,
      ingredients: [
        { ingredientName: 'Coffee Beans - Colombian', quantity: 18, unit: 'g' }
      ]
    },
    {
      productName: 'Cappuccino',
      name: 'Traditional Cappuccino',
      difficulty: 'MEDIUM',
      servingSize: 1,
      ingredients: [
        { ingredientName: 'Coffee Beans - Colombian', quantity: 18, unit: 'g' },
        { ingredientName: 'Milk', quantity: 150, unit: 'ml' }
      ]
    },
    {
      productName: 'Mocha Latte',
      name: 'Chocolate Mocha',
      difficulty: 'MEDIUM',
      servingSize: 1,
      ingredients: [
        { ingredientName: 'Coffee Beans - Colombian', quantity: 18, unit: 'g' },
        { ingredientName: 'Milk', quantity: 200, unit: 'ml' },
        { ingredientName: 'Cocoa Powder', quantity: 10, unit: 'g' },
        { ingredientName: 'Sugar', quantity: 5, unit: 'g' }
      ]
    }
  ],
  
  // Product variants
  variants: [
    {
      productName: 'Espresso Coffee',
      name: 'Ethiopian Espresso',
      description: 'Premium Ethiopian beans variant',
      recipeName: 'Ethiopian Espresso Recipe',
      ingredients: [
        { ingredientName: 'Coffee Beans - Ethiopian', quantity: 18, unit: 'g' }
      ]
    },
    {
      productName: 'Cappuccino',
      name: 'Vanilla Cappuccino',
      description: 'Cappuccino with vanilla syrup',
      recipeName: 'Vanilla Cappuccino Recipe',
      ingredients: [
        { ingredientName: 'Coffee Beans - Colombian', quantity: 18, unit: 'g' },
        { ingredientName: 'Milk', quantity: 150, unit: 'ml' },
        { ingredientName: 'Vanilla Syrup', quantity: 15, unit: 'ml' }
      ]
    }
  ]
};

async function createDemoData() {
  console.log('🏗️  Creating demo data for recipe system...\n');
  
  try {
    // 1. Create ingredient products
    console.log('📦 Creating ingredient products...');
    const ingredientProducts = [];
    for (const ingredient of DEMO_DATA.ingredients) {
      const product = await prisma.product.create({
        data: {
          name: ingredient.name,
          type: 'INSUMO',
          category: 'Ingredients',
          stock: ingredient.stock,
          unit: ingredient.unit,
          unitCost: ingredient.unitCost,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      ingredientProducts.push(product);
      console.log(`  ✅ ${ingredient.name} - Stock: ${ingredient.stock}${ingredient.unit}`);
    }
    
    // 2. Create finished products
    console.log('\n☕ Creating finished products...');
    const finishedProducts = [];
    for (const product of DEMO_DATA.products) {
      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          type: product.type,
          category: product.category,
          stock: 0, // Recipe-based products don't have direct stock
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      finishedProducts.push(createdProduct);
      console.log(`  ✅ ${product.name}`);
    }
    
    // 3. Create recipes
    console.log('\n📋 Creating recipes...');
    const recipes = [];
    for (const recipeData of DEMO_DATA.recipes) {
      const product = finishedProducts.find(p => p.name === recipeData.productName);
      if (!product) continue;
      
      const recipe = await prisma.recipe.create({
        data: {
          name: recipeData.name,
          productId: product.id,
          isDefault: true,
          servingSize: recipeData.servingSize,
          difficulty: recipeData.difficulty,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Add recipe ingredients
      for (const ingredientData of recipeData.ingredients) {
        const ingredient = ingredientProducts.find(p => p.name === ingredientData.ingredientName);
        if (!ingredient) continue;
        
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId: ingredient.id,
            quantity: ingredientData.quantity,
            unit: ingredientData.unit,
            isOptional: false
          }
        });
      }
      
      recipes.push(recipe);
      console.log(`  ✅ ${recipeData.name} (${recipeData.difficulty})`);
    }
    
    // 4. Create product variants
    console.log('\n🎨 Creating product variants...');
    for (const variantData of DEMO_DATA.variants) {
      const product = finishedProducts.find(p => p.name === variantData.productName);
      if (!product) continue;
      
      // Create variant recipe first
      const variantRecipe = await prisma.recipe.create({
        data: {
          name: variantData.recipeName,
          productId: product.id,
          isDefault: false,
          servingSize: 1,
          difficulty: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Add variant recipe ingredients
      for (const ingredientData of variantData.ingredients) {
        const ingredient = ingredientProducts.find(p => p.name === ingredientData.ingredientName);
        if (!ingredient) continue;
        
        await prisma.recipeIngredient.create({
          data: {
            recipeId: variantRecipe.id,
            ingredientId: ingredient.id,
            quantity: ingredientData.quantity,
            unit: ingredientData.unit,
            isOptional: false
          }
        });
      }
      
      // Create product variant
      const variant = await prisma.productVariant.create({
        data: {
          name: variantData.name,
          description: variantData.description,
          productId: product.id,
          recipeId: variantRecipe.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ ${variantData.name}`);
    }
    
    return { ingredientProducts, finishedProducts, recipes };
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  }
}

async function demonstrateProjectedInventory() {
  console.log('\n📊 Calculating projected inventory...\n');
  
  try {
    // Get all finished products with their recipes
    const products = await prisma.product.findMany({
      where: { type: 'TERMINADO' },
      include: {
        recipes: {
          where: { isDefault: true },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        },
        variants: {
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
        }
      }
    });
    
    for (const product of products) {
      console.log(`☕ ${product.name}:`);
      
      // Calculate for default recipe
      if (product.recipes.length > 0) {
        const recipe = product.recipes[0];
        let minPossible = Infinity;
        let limitingIngredient = null;
        
        for (const recipeIngredient of recipe.ingredients) {
          if (recipeIngredient.isOptional) continue;
          
          const availableStock = recipeIngredient.ingredient.stock;
          const requiredPerUnit = recipeIngredient.quantity;
          const possibleFromThisIngredient = Math.floor(availableStock / requiredPerUnit);
          
          if (possibleFromThisIngredient < minPossible) {
            minPossible = possibleFromThisIngredient;
            limitingIngredient = recipeIngredient.ingredient.name;
          }
        }
        
        const canMake = minPossible === Infinity ? 0 : minPossible;
        console.log(`  📈 Default Recipe: Can make ${canMake} units`);
        if (limitingIngredient) {
          console.log(`  ⚠️  Limited by: ${limitingIngredient}`);
        }
      }
      
      // Calculate for variants
      for (const variant of product.variants) {
        if (!variant.recipe) continue;
        
        let minPossible = Infinity;
        let limitingIngredient = null;
        
        for (const recipeIngredient of variant.recipe.ingredients) {
          if (recipeIngredient.isOptional) continue;
          
          const availableStock = recipeIngredient.ingredient.stock;
          const requiredPerUnit = recipeIngredient.quantity;
          const possibleFromThisIngredient = Math.floor(availableStock / requiredPerUnit);
          
          if (possibleFromThisIngredient < minPossible) {
            minPossible = possibleFromThisIngredient;
            limitingIngredient = recipeIngredient.ingredient.name;
          }
        }
        
        const canMake = minPossible === Infinity ? 0 : minPossible;
        console.log(`  🎨 ${variant.name}: Can make ${canMake} units`);
        if (limitingIngredient) {
          console.log(`     ⚠️  Limited by: ${limitingIngredient}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error calculating projected inventory:', error);
    throw error;
  }
}

async function demonstrateSalesProcessing() {
  console.log('💰 Demonstrating sales processing with ingredient consumption...\n');
  
  try {
    // Get a product to sell
    const cappuccino = await prisma.product.findFirst({
      where: { name: 'Cappuccino' },
      include: {
        recipes: {
          where: { isDefault: true },
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
    
    if (!cappuccino || !cappuccino.recipes[0]) {
      console.log('❌ Cappuccino product or recipe not found');
      return;
    }
    
    const recipe = cappuccino.recipes[0];
    const quantityToSell = 5; // Sell 5 cappuccinos
    
    console.log(`🛒 Processing sale: ${quantityToSell}x ${cappuccino.name}`);
    console.log('📋 Recipe ingredients:');
    
    // Show ingredient requirements
    for (const recipeIngredient of recipe.ingredients) {
      const totalNeeded = recipeIngredient.quantity * quantityToSell;
      console.log(`  - ${recipeIngredient.ingredient.name}: ${totalNeeded}${recipeIngredient.unit} (${recipeIngredient.quantity}${recipeIngredient.unit} each)`);
    }
    
    console.log('\n📦 Stock before sale:');
    for (const recipeIngredient of recipe.ingredients) {
      console.log(`  - ${recipeIngredient.ingredient.name}: ${recipeIngredient.ingredient.stock}${recipeIngredient.ingredient.unit}`);
    }
    
    // Process the sale
    const usageRecords = [];
    for (const recipeIngredient of recipe.ingredients) {
      const totalQuantityUsed = recipeIngredient.quantity * quantityToSell;
      
      // Record ingredient usage
      const usage = await prisma.ingredientUsage.create({
        data: {
          ingredientId: recipeIngredient.ingredientId,
          productId: cappuccino.id,
          variantId: null,
          quantity: totalQuantityUsed,
          unit: recipeIngredient.unit,
          cost: recipeIngredient.ingredient.unitCost * totalQuantityUsed,
          createdBy: 'demo-system',
          createdAt: new Date()
        }
      });
      
      // Decrement ingredient stock
      await prisma.product.update({
        where: { id: recipeIngredient.ingredientId },
        data: {
          stock: {
            decrement: Math.ceil(totalQuantityUsed)
          }
        }
      });
      
      usageRecords.push(usage);
    }
    
    // Show updated stock
    console.log('\n📦 Stock after sale:');
    const updatedIngredients = await prisma.product.findMany({
      where: {
        id: {
          in: recipe.ingredients.map(ri => ri.ingredientId)
        }
      }
    });
    
    for (const ingredient of updatedIngredients) {
      console.log(`  - ${ingredient.name}: ${ingredient.stock}${ingredient.unit}`);
    }
    
    console.log(`\n✅ Sale processed successfully! Created ${usageRecords.length} usage records.`);
    
  } catch (error) {
    console.error('❌ Error processing sale:', error);
    throw error;
  }
}

async function demonstrateAnalytics() {
  console.log('\n📈 Generating usage analytics...\n');
  
  try {
    // Get ingredient usage statistics
    const usageStats = await prisma.ingredientUsage.groupBy({
      by: ['ingredientId'],
      _sum: {
        quantity: true,
        cost: true
      },
      _count: {
        id: true
      }
    });
    
    console.log('🔍 Ingredient Usage Summary:');
    for (const stat of usageStats) {
      const ingredient = await prisma.product.findUnique({
        where: { id: stat.ingredientId }
      });
      
      if (ingredient) {
        console.log(`  📊 ${ingredient.name}:`);
        console.log(`     Total used: ${stat._sum.quantity}${ingredient.unit}`);
        console.log(`     Total cost: $${stat._sum.cost?.toFixed(2) || '0.00'}`);
        console.log(`     Usage events: ${stat._count.id}`);
        console.log('');
      }
    }
    
    // Show recent usage
    const recentUsage = await prisma.ingredientUsage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: true,
        product: true
      }
    });
    
    console.log('🕒 Recent Usage Events:');
    for (const usage of recentUsage) {
      console.log(`  • ${usage.ingredient.name} → ${usage.product.name}`);
      console.log(`    ${usage.quantity}${usage.unit} (Cost: $${usage.cost?.toFixed(2) || '0.00'})`);
      console.log(`    ${usage.createdAt.toISOString()}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error generating analytics:', error);
    throw error;
  }
}

async function cleanupDemoData() {
  console.log('🧹 Cleaning up demo data...\n');
  
  try {
    // Delete in reverse order of dependencies
    await prisma.ingredientUsage.deleteMany({
      where: {
        createdBy: 'demo-system'
      }
    });
    
    await prisma.productVariant.deleteMany({
      where: {
        product: {
          name: {
            in: DEMO_DATA.products.map(p => p.name)
          }
        }
      }
    });
    
    await prisma.recipeIngredient.deleteMany({
      where: {
        recipe: {
          product: {
            name: {
              in: DEMO_DATA.products.map(p => p.name)
            }
          }
        }
      }
    });
    
    await prisma.recipe.deleteMany({
      where: {
        product: {
          name: {
            in: DEMO_DATA.products.map(p => p.name)
          }
        }
      }
    });
    
    await prisma.product.deleteMany({
      where: {
        name: {
          in: [...DEMO_DATA.products.map(p => p.name), ...DEMO_DATA.ingredients.map(i => i.name)]
        }
      }
    });
    
    console.log('✅ Demo data cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up demo data:', error);
    throw error;
  }
}

async function main() {
  console.log('🎯 Recipe System Demo\n');
  console.log('This demo showcases the complete recipe-based product system:');
  console.log('• Recipe creation with ingredient tracking');
  console.log('• Product variants for different configurations');
  console.log('• Projected inventory calculations');
  console.log('• Real-time ingredient consumption');
  console.log('• Sales processing with stock updates');
  console.log('• Analytics and usage reports\n');
  
  try {
    // Create demo data
    await createDemoData();
    
    // Demonstrate projected inventory
    await demonstrateProjectedInventory();
    
    // Demonstrate sales processing
    await demonstrateSalesProcessing();
    
    // Show analytics
    await demonstrateAnalytics();
    
    // Recalculate projected inventory after sales
    console.log('🔄 Recalculating projected inventory after sales...');
    await demonstrateProjectedInventory();
    
    console.log('🎉 Demo completed successfully!');
    console.log('\nTo clean up demo data, run with --cleanup flag');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle cleanup flag
if (process.argv.includes('--cleanup')) {
  cleanupDemoData()
    .then(() => {
      console.log('✅ Cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
} else {
  main();
}
