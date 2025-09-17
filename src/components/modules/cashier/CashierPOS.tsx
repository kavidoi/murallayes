import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBarcodeReader } from '../../../hooks/useBarcodeReader';
import { useProductSearch, usePopularProducts } from '../../../hooks/useProductSearch';
import { useCart } from '../../../hooks/useCart';
import { validateBarcode } from '../../../utils/barcodeUtils';
import { VirtualProductGrid } from './VirtualProductGrid';
import { CartSidebar } from './CartSidebar';
import { productService } from '../../../services/cashier/productService';
import { cashierDB } from '../../../services/cashier/database';
import type { CashierProduct } from '../../../types/cashier';

interface CashierPOSProps {
  className?: string;
}

export const CashierPOS: React.FC<CashierPOSProps> = ({ className = '' }) => {
  const [selectedProduct, setSelectedProduct] = useState<CashierProduct | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hooks for product search and cart management
  const productSearch = useProductSearch({
    debounceMs: 150,
    pageSize: 50,
    minQueryLength: 0
  });
  
  const { products: popularProducts } = usePopularProducts(20);
  
  const cart = useCart({
    taxRate: 0.10,
    onItemAdded: (item) => {
      setStatusMessage(`✅ Added: ${item.name}`);
      setTimeout(() => setStatusMessage(''), 3000);
    },
    onItemRemoved: (item) => {
      setStatusMessage(`🗑️ Removed: ${item.name}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  });

  // Initialize database with sample data
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Check if we already have products
        const productCount = await cashierDB.products.count();
        if (productCount === 0) {
          // Sample products with comprehensive search terms
          const sampleProducts: CashierProduct[] = [
            {
              id: '1', sku: 'BEV001', barcode: '7894900011517', name: 'Coca Cola 500ml', 
              description: 'Classic Coca-Cola soft drink', price: 1.99, cost: 1.20,
              category: 'Beverages', brand: 'Coca-Cola', supplier: 'Beverage Distributors',
              stock: 45, minStock: 10, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['cola', 'soda', 'soft drink']
            },
            {
              id: '2', sku: 'SNK001', barcode: '0028400064057', name: 'Lay\'s Original Chips',
              description: 'Classic potato chips', price: 3.49, cost: 2.10,
              category: 'Snacks', brand: 'Lay\'s', supplier: 'Frito-Lay',
              stock: 32, minStock: 15, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['chips', 'potato', 'snack']
            },
            {
              id: '3', sku: 'BAK001', barcode: '0062000019436', name: 'Wonder Bread',
              description: 'White sandwich bread', price: 2.79, cost: 1.85,
              category: 'Bakery', brand: 'Wonder', supplier: 'Bakery Supply Co',
              stock: 18, minStock: 5, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['bread', 'sandwich', 'white bread']
            },
            {
              id: '4', sku: 'TOB001', barcode: '0028200000731', name: 'Marlboro Red',
              description: 'Marlboro Red cigarettes', price: 8.95, cost: 6.20,
              category: 'Tobacco', brand: 'Marlboro', supplier: 'Philip Morris',
              stock: 24, minStock: 10, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['cigarettes', 'tobacco', 'smokes']
            },
            {
              id: '5', sku: 'BEV002', barcode: '0613008725402', name: 'Arizona Iced Tea',
              description: 'Sweet iced tea beverage', price: 0.99, cost: 0.65,
              category: 'Beverages', brand: 'Arizona', supplier: 'Arizona Beverages',
              stock: 28, minStock: 12, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['tea', 'iced tea', 'arizona']
            },
            {
              id: '6', sku: 'CAN001', barcode: '0040000000051', name: 'Snickers Bar',
              description: 'Chocolate bar with peanuts', price: 1.29, cost: 0.85,
              category: 'Candy', brand: 'Snickers', supplier: 'Mars Inc',
              stock: 67, minStock: 20, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['chocolate', 'candy bar', 'peanuts']
            },
            {
              id: '7', sku: 'BEV003', barcode: '9002490100028', name: 'Red Bull Energy',
              description: 'Energy drink with caffeine', price: 2.49, cost: 1.65,
              category: 'Beverages', brand: 'Red Bull', supplier: 'Red Bull Distribution',
              stock: 15, minStock: 8, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['energy drink', 'caffeine', 'red bull']
            },
            {
              id: '8', sku: 'SNK002', barcode: '0028400064316', name: 'Doritos Nacho Cheese',
              description: 'Nacho cheese flavored tortilla chips', price: 4.19, cost: 2.65,
              category: 'Snacks', brand: 'Doritos', supplier: 'Frito-Lay',
              stock: 41, minStock: 18, isActive: true, imageUrl: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              searchTerms: '', nameWords: [], categoryPath: '', tags: ['chips', 'tortilla', 'nacho', 'cheese']
            }
          ];
          
          await productService.syncProducts(sampleProducts);
          console.log('Sample products loaded into database');
          
          // Refresh search results
          productSearch.refresh();
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initializeDatabase();
  }, [productSearch]);

  // Handle barcode scanning
  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    console.log('Barcode detected:', barcode);
    
    // Validate the barcode format
    const validation = validateBarcode(barcode);
    if (!validation.isValid) {
      setStatusMessage(`❌ Invalid barcode: ${barcode}`);
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    try {
      // Find product by barcode using the product service
      const product = await productService.getProductByBarcode(barcode);
      
      if (product) {
        // Add to cart
        cart.addItem(product, 1);
        setSelectedProduct(product);
      } else {
        // Product not found - show barcode in search
        productSearch.setQuery(barcode);
        setStatusMessage(`❌ Product not found: ${barcode}`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      setStatusMessage(`❌ Error looking up barcode: ${barcode}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  }, [cart, productSearch]);

  // Use barcode reader hook
  const { isScanning, lastBarcode: _lastBarcode, clearBuffer: _clearBuffer } = useBarcodeReader({
    onBarcodeScanned: handleBarcodeDetected,
    enabled: !isCheckingOut // Disable during checkout
  });

  // Handle product selection from grid
  const handleProductSelect = useCallback((product: CashierProduct) => {
    if (cart.canAddItem(product)) {
      cart.addItem(product, 1);
      setSelectedProduct(product);
    } else {
      setStatusMessage(`❌ Cannot add ${product.name}: Out of stock`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  }, [cart]);

  // Checkout process
  const handleCheckout = useCallback(async () => {
    if (cart.isEmpty) return;
    
    setIsCheckingOut(true);
    
    // Create transaction record with staff information
    const transaction = {
      items: cart.items,
      subtotal: cart.cart.subtotal,
      discount: cart.cart.discount,
      tax: cart.cart.tax,
      total: cart.cart.total,
      paymentMethod: 'cash' as const,
      cashierId: 'demo-user', // In production, this would come from authentication
      cashierName: 'Demo User', // Staff name for display and records
      timestamp: new Date().toISOString(),
      synced: false,
      receiptNumber: `RCP-${Date.now()}`,
      notes: `Processed by Demo User at ${currentTime.toLocaleString()}`
    };
    
    try {
      // Store transaction in local database for offline support
      const transactionId = await cashierDB.queueTransaction(transaction);
      console.log('Transaction saved:', transactionId, transaction);
      
      // Simulate checkout process
      setTimeout(() => {
        cart.clearCart();
        setIsCheckingOut(false);
        setSelectedProduct(null);
        setStatusMessage(`✅ Transaction completed! Receipt: ${transaction.receiptNumber}`);
        setTimeout(() => setStatusMessage(''), 5000);
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setIsCheckingOut(false);
      setStatusMessage('❌ Checkout failed. Please try again.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  }, [cart, currentTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'F5':
          e.preventDefault();
          if (!cart.isEmpty) {
            handleCheckout();
          }
          break;
        case 'Escape':
          e.preventDefault();
          productSearch.setQuery('');
          productSearch.clearFilters();
          setSelectedProduct(null);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cart.isEmpty, handleCheckout, productSearch]);

  // Focus search input on component mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Auto-clear status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Staff Info */}
        <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">🏪 Cashier POS</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">Cashier:</span>
              <span className="font-semibold bg-blue-700 px-2 py-1 rounded text-sm">
                Demo User
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Online</span>
            </div>
            <div className="opacity-90">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Search Bar & Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={productSearch.query}
                onChange={(e) => productSearch.setQuery(e.target.value)}
                placeholder="Search products or scan barcode... (F1)"
                className={`w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                          placeholder-gray-500 dark:placeholder-gray-400 ${
                  isScanning ? 'ring-2 ring-blue-500 ring-pulse' : ''
                }`}
                autoFocus
              />
              
              {/* Search Icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {productSearch.isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              
              {/* Search Results Info */}
              {productSearch.query && (
                <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 dark:text-gray-400 px-2">
                  {productSearch.totalCount} results in {productSearch.searchTime.toFixed(0)}ms
                </div>
              )}
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Keyboard Shortcuts Help */}
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 px-3">
              F1: Search • F5: Checkout • ESC: Clear
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={productSearch.filters.category || ''}
                    onChange={(e) => productSearch.setFilters({ 
                      ...productSearch.filters, 
                      category: e.target.value || undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Candy">Candy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Tobacco">Tobacco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    In Stock Only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productSearch.filters.inStock || false}
                      onChange={(e) => productSearch.setFilters({ 
                        ...productSearch.filters, 
                        inStock: e.target.checked || undefined 
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show only available items</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={productSearch.clearFilters}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Status Messages */}
          {statusMessage && (
            <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4">
          {productSearch.query || Object.keys(productSearch.filters).length > 0 ? (
            <VirtualProductGrid
              products={productSearch.products}
              onProductSelect={handleProductSelect}
              selectedProductId={selectedProduct?.id}
              isLoading={productSearch.isLoading}
              onLoadMore={productSearch.hasMore ? productSearch.loadMore : undefined}
              hasMore={productSearch.hasMore}
              height={600}
              itemHeight={180}
              itemWidth={200}
              className="h-full"
            />
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular Products
              </h3>
              <VirtualProductGrid
                products={popularProducts}
                onProductSelect={handleProductSelect}
                selectedProductId={selectedProduct?.id}
                height={600}
                itemHeight={180}
                itemWidth={200}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        cart={cart.cart}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
        onCheckout={handleCheckout}
        isCheckoutDisabled={isCheckingOut}
        className="w-80"
      />
    </div>
  );
};

export default CashierPOS;