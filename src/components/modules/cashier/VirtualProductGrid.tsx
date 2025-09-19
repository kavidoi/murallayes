import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import type { CashierProduct } from '../../../types/cashier';

interface VirtualProductGridProps {
  products: CashierProduct[];
  onProductSelect: (product: CashierProduct) => void;
  selectedProductId?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  height?: number;
  width?: number;
  itemHeight?: number;
  itemWidth?: number;
  columnCount?: number;
  className?: string;
}

interface ProductItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    products: CashierProduct[];
    columnCount: number;
    onProductSelect: (product: CashierProduct) => void;
    selectedProductId?: string;
    itemWidth: number;
  };
}

const ProductItem: React.FC<ProductItemProps> = ({ index, style, data }) => {
  const { products, columnCount, onProductSelect, selectedProductId, itemWidth } = data;
  const startIndex = index * columnCount;
  const items = products.slice(startIndex, startIndex + columnCount);

  return (
    <div style={style} className="flex gap-2 px-2">
      {items.map((product, _colIndex) => {
        const isSelected = product.id === selectedProductId;
        const isOutOfStock = product.stock <= 0;
        
        return (
          <div
            key={product.id}
            onClick={() => !isOutOfStock && onProductSelect(product)}
            className={`
              flex-1 bg-white dark:bg-gray-800 border rounded-lg p-3 cursor-pointer
              transition-all duration-200 min-w-0
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${isOutOfStock 
                ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
                : 'hover:shadow-md'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            `}
            style={{ maxWidth: `${itemWidth}px` }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isOutOfStock) {
                  onProductSelect(product);
                }
              }
            }}
            role="button"
            aria-label={`Add ${product.name} to cart. Price: $${product.price.toFixed(2)}${isOutOfStock ? ' (Out of stock)' : ''}`}
          >
            {/* Product Image */}
            {product.imageUrl ? (
              <div className="w-full h-20 mb-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-full h-20 mb-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-2xl text-gray-400">📦</span>
              </div>
            )}

            {/* Product Name */}
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>

            {/* Product Info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${product.price.toFixed(2)}
                </span>
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded">
                    Low: {product.stock}
                  </span>
                )}
                {product.stock <= 0 && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded">
                    Out
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {product.category}
              </div>

              {/* SKU */}
              <div className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">
                {product.sku}
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Fill empty slots */}
      {items.length < columnCount && (
        Array.from({ length: columnCount - items.length }, (_, i) => (
          <div key={`empty-${i}`} className="flex-1" style={{ maxWidth: `${itemWidth}px` }} />
        ))
      )}
    </div>
  );
};

export const VirtualProductGrid: React.FC<VirtualProductGridProps> = ({
  products,
  onProductSelect,
  selectedProductId,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  height = 400,
  width = 800,
  itemHeight = 180,
  itemWidth = 200,
  columnCount: propColumnCount,
  className = ''
}) => {
  const gridRef = useRef<Grid>(null);
  const [containerSize, setContainerSize] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate optimal column count based on container width
  const columnCount = useMemo(() => {
    if (propColumnCount) return propColumnCount;
    const availableWidth = containerSize.width - 32; // Account for padding
    const minColumns = 2;
    const maxColumns = 6;
    const columns = Math.floor(availableWidth / (itemWidth + 8)); // 8px for gap
    return Math.max(minColumns, Math.min(maxColumns, columns));
  }, [containerSize.width, itemWidth, propColumnCount]);

  // Calculate row count
  const rowCount = Math.ceil(products.length / columnCount);

  // Adjust item width to fill available space
  const adjustedItemWidth = useMemo(() => {
    const availableWidth = containerSize.width - 32 - (columnCount - 1) * 8; // padding + gaps
    return Math.floor(availableWidth / columnCount);
  }, [containerSize.width, columnCount]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerSize({
          width: offsetWidth,
          height: Math.min(offsetHeight, height)
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height]);

  // Handle infinite scrolling
  const handleItemsRendered = useCallback(({
    visibleRowStartIndex: _visibleRowStartIndex,
    visibleRowStopIndex,
  }: {
    visibleRowStartIndex: number;
    visibleRowStopIndex: number;
  }) => {
    // Load more when near the end
    const threshold = 5;
    if (
      hasMore &&
      !isLoading &&
      onLoadMore &&
      visibleRowStopIndex >= rowCount - threshold
    ) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, rowCount]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedProductId) return;

    const currentIndex = products.findIndex(p => p.id === selectedProductId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, products.length - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = Math.min(currentIndex + columnCount, products.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = Math.max(currentIndex - columnCount, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const product = products[currentIndex];
        if (product && product.stock > 0) {
          onProductSelect(product);
        }
        return;
      default:
        return;
    }

    if (nextIndex !== currentIndex && products[nextIndex]) {
      onProductSelect(products[nextIndex]);
      
      // Scroll to selected item
      const rowIndex = Math.floor(nextIndex / columnCount);
      gridRef.current?.scrollToItem({ rowIndex, align: 'smart' });
    }
  }, [selectedProductId, products, columnCount, onProductSelect]);

  // Prepare data for virtual grid
  const itemData = useMemo(() => ({
    products,
    columnCount,
    onProductSelect,
    selectedProductId,
    itemWidth: adjustedItemWidth
  }), [products, columnCount, onProductSelect, selectedProductId, adjustedItemWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: '100%', height: `${height}px` }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {products.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <Grid
          ref={gridRef}
          className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          height={containerSize.height}
          width={containerSize.width}
          rowCount={rowCount}
          columnCount={1} // We handle columns manually in ProductItem
          rowHeight={itemHeight}
          columnWidth={containerSize.width}
          itemData={itemData}
          onItemsRendered={handleItemsRendered}
          overscanRowCount={2}
        >
          {ProductItem as any}
        </Grid>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading products...</span>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <button
        onClick={() => gridRef.current?.scrollTo({ scrollTop: 0 })}
        className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </button>
    </div>
  );
};