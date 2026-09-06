import React, { useState, useMemo } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
interface ModelsOrderModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelsOrderModal({ product, isOpen, onClose }: ModelsOrderModalProps) {
  const { addToCart, isLoading } = useCartStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const [modelQuantities, setModelQuantities] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Calculate total quantity
  const totalQuantity = useMemo(() => {
    return Object.values(modelQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
  }, [modelQuantities]);

  const minOrderQty = product.minOrderQty || 1;

  if (!isOpen || !product.hasModels || !product.availableModels) return null;

  const handleQuantityChange = (modelName: string, value: string) => {
    const qty = parseInt(value) || 0;
    setModelQuantities(prev => ({
      ...prev,
      [modelName]: Math.max(0, qty)
    }));
    setError('');
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (totalQuantity < minOrderQty) {
      setError(`Total quantity must be at least ${minOrderQty} to meet MOQ.`);
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const selectedModels = Object.entries(modelQuantities).filter(([_, qty]) => qty > 0);
      
      // Add items sequentially to avoid race conditions in backend cart saving
      for (const [modelName, quantity] of selectedModels) {
        await addToCart(product._id || product.id, quantity, undefined, modelName);
      }
      
      onClose();
      // Reset state after closing
      setTimeout(() => setModelQuantities({}), 300);
    } catch (err: any) {
      console.error('Failed to add models to cart', err);
      setError(err?.response?.data?.message || 'Failed to add to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Select Models</h2>
            <p className="text-sm text-gray-500 mt-1">{product.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p>{error}</p>
            </div>
          )}

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
            <div>
              <p className="text-sm text-blue-900 font-medium">Minimum Order Quantity (MOQ): {minOrderQty}</p>
              <p className="text-xs text-blue-700 mt-1">You can mix and match models, but the total combined quantity must be at least {minOrderQty}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.availableModels.map((model, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all bg-gray-50/50">
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{model.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Stock: {model.stock}</p>
                </div>
                <div className="w-24">
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max={model.stock}
                      value={modelQuantities[model.name] || ''}
                      onChange={(e) => handleQuantityChange(model.name, e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={model.stock <= 0}
                    />
                    {model.stock <= 0 && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex items-center justify-center cursor-not-allowed">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Out</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <p className="text-sm text-gray-500">Total Selected Quantity</p>
            <p className={`text-xl font-bold ${totalQuantity < minOrderQty ? 'text-orange-500' : 'text-green-600'}`}>
              {totalQuantity} <span className="text-sm font-normal text-gray-500">/ {minOrderQty} MOQ</span>
            </p>
          </div>
          
          <div className="w-full sm:w-auto flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={totalQuantity < minOrderQty || isAdding || isLoading}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Adding...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
