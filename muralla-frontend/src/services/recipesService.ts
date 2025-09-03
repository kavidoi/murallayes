export interface Recipe {
  id: string;
  name: string;
  description?: string;
  productId: string;
  isDefault: boolean;
  servingSize: number;
  prepTime?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  instructions?: string;
  ingredients: RecipeIngredient[];
  variants: ProductVariant[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  notes?: string;
  ingredient: {
    id: string;
    name: string;
    stock: number;
    unitCost?: number;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  description?: string;
  productId: string;
  recipeId?: string;
  priceAdjustment?: number;
  isActive: boolean;
  sortOrder: number;
  recipe?: Recipe;
}

export interface ProjectedInventory {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  canMake: number;
  limitingIngredient?: {
    id: string;
    name: string;
    available: number;
    required: number;
  };
  recipe: {
    id: string;
    name: string;
    ingredients: Array<{
      id: string;
      name: string;
      required: number;
      available: number;
      unit: string;
      isOptional: boolean;
    }>;
  };
}

export interface IngredientUsageStats {
  totalQuantity: number;
  totalCost: number;
  usageCount: number;
  byProduct: Record<string, {
    quantity: number;
    cost: number;
    count: number;
  }>;
  recentUsage: Array<{
    id: string;
    quantity: number;
    unit: string;
    usedAt: string;
    cost?: number;
    product: { name: string };
    variant?: { name: string };
  }>;
}

export interface ProRataReport {
  [ingredientName: string]: {
    totalQuantity: number;
    totalCost: number;
    products: {
      [productName: string]: {
        quantity: number;
        cost: number;
        percentage: number;
      };
    };
  };
}

class RecipesService {
  // Recipe Management
  async createRecipe(recipeData: Partial<Recipe>): Promise<Recipe> {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(recipeData)
    });
    return response.json();
  }

  async getProductRecipes(productId: string): Promise<Recipe[]> {
    const response = await fetch(`/api/recipes/product/${productId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }

  async addIngredientToRecipe(recipeId: string, ingredientData: Partial<RecipeIngredient>): Promise<RecipeIngredient> {
    const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(ingredientData)
    });
    return response.json();
  }

  // Product Variants
  async createProductVariant(variantData: Partial<ProductVariant>): Promise<ProductVariant> {
    const response = await fetch('/api/recipes/variants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(variantData)
    });
    return response.json();
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const response = await fetch(`/api/recipes/variants/${productId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }

  // Sales Processing
  async processSale(saleData: {
    productId: string;
    variantId?: string;
    quantity: number;
    soldBy: string;
  }): Promise<any> {
    const response = await fetch('/api/recipes/sales/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(saleData)
    });
    return response.json();
  }

  // Projected Inventory
  async getProjectedInventory(productId: string, variantId?: string): Promise<ProjectedInventory> {
    const params = variantId ? `?variantId=${variantId}` : '';
    const response = await fetch(`/api/recipes/inventory/projected/${productId}${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }

  async getAllProjectedInventory(): Promise<ProjectedInventory[]> {
    const response = await fetch('/api/recipes/inventory/projected', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }

  // Analytics
  async getIngredientStats(
    ingredientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IngredientUsageStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await fetch(`/api/recipes/analytics/ingredient/${ingredientId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }

  async getProRataReport(startDate: Date, endDate: Date): Promise<ProRataReport> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const response = await fetch(`/api/recipes/analytics/prorata?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }
}

export const recipesService = new RecipesService();
