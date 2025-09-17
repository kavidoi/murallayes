import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  ChefHat, 
  Clock, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Package,
  Beaker
} from 'lucide-react';
import { recipesService, type Recipe, type ProjectedInventory, type ProductVariant } from '../../../services/recipesService';

interface RecipeManagerProps {
  productId?: string;
}

const RecipeManager: React.FC<RecipeManagerProps> = ({ productId }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [projectedInventory, setProjectedInventory] = useState<ProjectedInventory[]>([]);
  // const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipes' | 'variants' | 'inventory' | 'analytics'>('inventory');

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (productId) {
        // Load data for specific product
        const [recipesData, variantsData, inventoryData] = await Promise.all([
          recipesService.getProductRecipes(productId),
          recipesService.getProductVariants(productId),
          recipesService.getProjectedInventory(productId)
        ]);
        
        setRecipes(recipesData);
        setVariants(variantsData);
        setProjectedInventory([inventoryData]);
      } else {
        // Load all projected inventory data
        const inventoryData = await recipesService.getAllProjectedInventory();
        setProjectedInventory(inventoryData);
      }
    } catch (error) {
      console.error('Error loading recipe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-orange-600 bg-orange-100';
      case 'EXPERT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockStatusColor = (canMake: number) => {
    if (canMake === 0) return 'text-red-600 bg-red-100';
    if (canMake < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Recipe Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage recipes, variants, and track projected inventory for prepared products
          </p>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          New Recipe
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inventory', label: 'Projected Inventory', icon: Package },
            { id: 'recipes', label: 'Recipes', icon: ChefHat },
            { id: 'variants', label: 'Variants', icon: Beaker },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Projected Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {projectedInventory.filter((p: ProjectedInventory) => p.canMake > 0).map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId || 'default'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.productName}
                      </h3>
                      {item.variantName && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {item.variantName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStockStatusColor(item.canMake)}`}>
                        Can make: {item.canMake} units
                      </div>
                      
                      {item.limitingIngredient && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Limited by: {item.limitingIngredient.name}
                        </div>
                      )}
                    </div>

                    {/* Recipe Ingredients */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recipe: {item.recipe.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {item.recipe.ingredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className={`p-2 rounded border text-xs ${
                              ingredient.available < ingredient.required
                                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            }`}
                          >
                            <div className="font-medium">{ingredient.name}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Need: {ingredient.required} {ingredient.unit}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Have: {ingredient.available} {ingredient.unit}
                            </div>
                            {ingredient.isOptional && (
                              <div className="text-blue-600 text-xs">Optional</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {projectedInventory.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Recipe-Based Products
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create recipes for your products to see projected inventory calculations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recipe.name}
                      </h3>
                      {recipe.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                    
                    {recipe.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {recipe.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Serves {recipe.servingSize}
                      </div>
                      {recipe.prepTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {recipe.prepTime} min
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ingredients ({recipe.ingredients.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recipe.ingredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                      >
                        <span className="font-medium">{ingredient.ingredient.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {ingredient.quantity} {ingredient.unit}
                          {ingredient.isOptional && ' (optional)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {recipe.instructions && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructions
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {recipe.instructions}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {recipes.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Recipes Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first recipe to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {variants.map((variant) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {variant.name}
                      </h3>
                      {!variant.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {variant.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {variant.description}
                      </p>
                    )}
                    
                    {variant.priceAdjustment && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Price adjustment: </span>
                        <span className={variant.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                          {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {variants.length === 0 && (
            <div className="text-center py-12">
              <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Variants Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create product variants to offer different options.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ingredient usage analytics and pro-rata reports will be available here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;
