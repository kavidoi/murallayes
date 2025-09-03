import { useState, useCallback, useMemo, useRef } from 'react';
import type { CartItem, Cart, CashierProduct } from '../types/cashier';

interface UseCartOptions {
  taxRate?: number;
  onItemAdded?: (item: CartItem) => void;
  onItemRemoved?: (item: CartItem) => void;
  onQuantityChanged?: (item: CartItem, oldQuantity: number) => void;
  onCartCleared?: () => void;
}

interface UseCartReturn {
  // Cart state
  cart: Cart;
  items: CartItem[];
  isEmpty: boolean;
  itemCount: number;
  
  // Actions with optimistic updates
  addItem: (product: CashierProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Bulk operations
  addMultipleItems: (products: { product: CashierProduct; quantity: number }[]) => void;
  removeMultipleItems: (productIds: string[]) => void;
  
  // Discount operations
  applyDiscount: (discount: number, isPercentage?: boolean) => void;
  removeDiscount: () => void;
  
  // Cart utilities
  getItem: (productId: string) => CartItem | undefined;
  hasItem: (productId: string) => boolean;
  canAddItem: (product: CashierProduct, quantity?: number) => boolean;
  
  // Calculations
  recalculateCart: () => void;
}

export function useCart(options: UseCartOptions = {}): UseCartReturn {
  const {
    taxRate = 0.10, // 10% default tax
    onItemAdded,
    onItemRemoved,
    onQuantityChanged,
    onCartCleared
  } = options;

  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  
  // Use ref for performance optimization
  const taxRateRef = useRef(taxRate);
  taxRateRef.current = taxRate;

  // Calculate cart totals with memoization
  const cart = useMemo((): Cart => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discount;
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = subtotalAfterDiscount * taxRateRef.current;
    const total = subtotalAfterDiscount + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      itemCount
    };
  }, [items, discount]);

  // Helper to create cart item from product
  const createCartItem = useCallback((product: CashierProduct, quantity: number): CartItem => {
    const price = product.price;
    const subtotal = price * quantity;
    
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price,
      quantity,
      subtotal,
      barcode: product.barcode
    };
  }, []);

  // Add item with optimistic update
  const addItem = useCallback((product: CashierProduct, quantity = 1) => {
    if (quantity <= 0 || !canAddItem(product, quantity)) return;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.productId === product.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingIndex];
        const oldQuantity = existingItem.quantity;
        const newQuantity = oldQuantity + quantity;
        
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: existingItem.price * newQuantity
        };
        
        // Trigger callback
        onQuantityChanged?.(updatedItems[existingIndex], oldQuantity);
        
        return updatedItems;
      } else {
        // Add new item
        const newItem = createCartItem(product, quantity);
        onItemAdded?.(newItem);
        return [...prevItems, newItem];
      }
    });
  }, [createCartItem, onItemAdded, onQuantityChanged]);

  // Remove item with optimistic update
  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.productId === productId);
      if (itemToRemove) {
        onItemRemoved?.(itemToRemove);
      }
      
      return prevItems.filter(item => item.productId !== productId);
    });
  }, [onItemRemoved]);

  // Update quantity with optimistic update
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 0) return;
    
    if (quantity === 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          const oldQuantity = item.quantity;
          const updatedItem = {
            ...item,
            quantity,
            subtotal: item.price * quantity
          };
          
          onQuantityChanged?.(updatedItem, oldQuantity);
          return updatedItem;
        }
        return item;
      });
    });
  }, [removeItem, onQuantityChanged]);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    onCartCleared?.();
  }, [onCartCleared]);

  // Add multiple items (bulk operation)
  const addMultipleItems = useCallback((
    products: { product: CashierProduct; quantity: number }[]
  ) => {
    const validProducts = products.filter(({ product, quantity }) => 
      canAddItem(product, quantity)
    );

    if (validProducts.length === 0) return;

    setItems(prevItems => {
      const itemsMap = new Map(prevItems.map(item => [item.productId, item]));
      
      validProducts.forEach(({ product, quantity }) => {
        const existing = itemsMap.get(product.id);
        
        if (existing) {
          const newQuantity = existing.quantity + quantity;
          const updatedItem = {
            ...existing,
            quantity: newQuantity,
            subtotal: existing.price * newQuantity
          };
          itemsMap.set(product.id, updatedItem);
          onQuantityChanged?.(updatedItem, existing.quantity);
        } else {
          const newItem = createCartItem(product, quantity);
          itemsMap.set(product.id, newItem);
          onItemAdded?.(newItem);
        }
      });
      
      return Array.from(itemsMap.values());
    });
  }, [createCartItem, onItemAdded, onQuantityChanged]);

  // Remove multiple items (bulk operation)
  const removeMultipleItems = useCallback((productIds: string[]) => {
    setItems(prevItems => {
      const removedItems = prevItems.filter(item => productIds.includes(item.productId));
      removedItems.forEach(item => onItemRemoved?.(item));
      
      return prevItems.filter(item => !productIds.includes(item.productId));
    });
  }, [onItemRemoved]);

  // Apply discount
  const applyDiscount = useCallback((discountValue: number, isPercentage = false) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const actualDiscount = isPercentage 
      ? (subtotal * discountValue / 100)
      : discountValue;
    
    setDiscount(Math.max(0, Math.min(actualDiscount, subtotal)));
  }, [items]);

  // Remove discount
  const removeDiscount = useCallback(() => {
    setDiscount(0);
  }, []);

  // Get specific item
  const getItem = useCallback((productId: string): CartItem | undefined => {
    return items.find(item => item.productId === productId);
  }, [items]);

  // Check if cart has item
  const hasItem = useCallback((productId: string): boolean => {
    return items.some(item => item.productId === productId);
  }, [items]);

  // Check if item can be added (stock validation)
  const canAddItem = useCallback((product: CashierProduct, quantity = 1): boolean => {
    if (quantity <= 0 || !product.isActive) return false;
    
    const existingItem = getItem(product.id);
    const currentQuantity = existingItem?.quantity || 0;
    const totalQuantity = currentQuantity + quantity;
    
    // Check stock availability
    return totalQuantity <= product.stock;
  }, [getItem]);

  // Manual recalculation (useful for external updates)
  const recalculateCart = useCallback(() => {
    setItems(prevItems => [...prevItems]); // Force re-render
  }, []);

  // Computed properties
  const isEmpty = items.length === 0;
  const itemCount = cart.itemCount;

  return {
    // Cart state
    cart,
    items,
    isEmpty,
    itemCount,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Bulk operations
    addMultipleItems,
    removeMultipleItems,
    
    // Discount operations
    applyDiscount,
    removeDiscount,
    
    // Cart utilities
    getItem,
    hasItem,
    canAddItem,
    
    // Calculations
    recalculateCart
  };
}

// Hook for persistent cart (uses localStorage)
export function usePersistentCart(storageKey = 'cashier-cart', options: UseCartOptions = {}) {
  const cart = useCart(options);
  
  // Load cart from localStorage on init
  React.useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const { items, discount } = JSON.parse(savedCart);
        // Restore cart items
        if (Array.isArray(items) && items.length > 0) {
          // Note: In production, you'd want to validate against current product data
          // For now, we'll restore as-is
        }
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    }
  }, [storageKey]);

  // Save cart to localStorage on changes
  React.useEffect(() => {
    try {
      const cartData = {
        items: cart.items,
        discount: cart.cart.discount,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }, [cart.items, cart.cart.discount, storageKey]);

  // Clear storage on cart clear
  const clearCartAndStorage = React.useCallback(() => {
    cart.clearCart();
    localStorage.removeItem(storageKey);
  }, [cart.clearCart, storageKey]);

  return {
    ...cart,
    clearCart: clearCartAndStorage
  };
}