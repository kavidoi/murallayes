import React, { useState, useCallback } from 'react';
import type { Cart, CartItem } from '../../../types/cashier';

interface CartSidebarProps {
  cart: Cart;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
  className?: string;
}

const CartItemComponent: React.FC<{
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.quantity.toString());

  const handleQuantityEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(item.quantity.toString());
  }, [item.quantity]);

  const handleQuantitySubmit = useCallback(() => {
    const newQuantity = parseInt(editValue, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      setEditValue(item.quantity.toString());
    } else if (newQuantity === 0) {
      onRemove(item.productId);
    } else {
      onUpdateQuantity(item.productId, newQuantity);
    }
    setIsEditing(false);
  }, [editValue, item.productId, item.quantity, onUpdateQuantity, onRemove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantitySubmit();
    } else if (e.key === 'Escape') {
      setEditValue(item.quantity.toString());
      setIsEditing(false);
    }
  }, [handleQuantitySubmit, item.quantity]);

  const handleQuickAdjust = useCallback((delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      onRemove(item.productId);
    } else {
      onUpdateQuantity(item.productId, newQuantity);
    }
  }, [item.quantity, item.productId, onUpdateQuantity, onRemove]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {item.sku}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            ${item.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuickAdjust(-1)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Decrease quantity"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleQuantitySubmit}
            onKeyDown={handleKeyDown}
            className="w-12 h-7 text-center text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="0"
            autoFocus
          />
        ) : (
          <button
            onClick={handleQuantityEdit}
            className="w-12 h-7 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {item.quantity}
          </button>
        )}

        <button
          onClick={() => handleQuickAdjust(1)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Increase quantity"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <div className="font-semibold text-gray-900 dark:text-white">
          ${item.subtotal.toFixed(2)}
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        aria-label={`Remove ${item.name}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckoutDisabled = false,
  className = ''
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCart = useCallback(() => {
    if (showClearConfirm) {
      onClearCart();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  }, [showClearConfirm, onClearCart]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cart
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        
        {cart.items.length > 0 && (
          <button
            onClick={handleClearCart}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showClearConfirm
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {showClearConfirm ? 'Confirm Clear' : 'Clear'}
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-hidden">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-lg font-medium">Cart is empty</p>
            <p className="text-sm">Add products to get started</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {cart.items.map((item) => (
              <CartItemComponent
                key={item.productId}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary & Checkout */}
      {cart.items.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${cart.subtotal.toFixed(2)}
              </span>
            </div>
            
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  -${cart.discount.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${cart.tax.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">
                ${cart.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Staff Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 border-t border-gray-200 dark:border-gray-700">
            Cashier: <span className="font-medium text-gray-700 dark:text-gray-300">Demo User</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={isCheckoutDisabled}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-lg
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCheckoutDisabled ? 'Processing...' : `Checkout $${cart.total.toFixed(2)}`}
          </button>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {/* TODO: Apply discount */}}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Discount
            </button>
            <button
              onClick={() => {/* TODO: Hold order */}}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Hold
            </button>
          </div>
        </div>
      )}
    </div>
  );
};