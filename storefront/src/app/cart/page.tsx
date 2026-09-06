'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettings } from '@/hooks/useApi';
import api from '@/lib/api';

export default function CartPage() {
  const { items, isLoading, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { settings } = useSettings();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const getStepQty = (product: any, currentQty: number) => {
    if (product.isLot && product.lotDetails) {
      const { fullLotQuantity, halfLotQuantity, miniLotQuantity, allowHalfLot, allowMiniLot } = product.lotDetails;
      if (allowMiniLot && miniLotQuantity && currentQty % miniLotQuantity === 0) return miniLotQuantity;
      if (allowHalfLot && halfLotQuantity && currentQty % halfLotQuantity === 0) return halfLotQuantity;
      if (fullLotQuantity && currentQty % fullLotQuantity === 0) return fullLotQuantity;
      return fullLotQuantity || 1;
    }
    return product.minOrderQty || 1;
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isAuthenticated) {
      fetchCart();
    } else {
      openLoginModal();
    }
  }, [isMounted, isAuthenticated, fetchCart, openLoginModal]);

  // Calculations based on backend items — use optional chaining + fallback to 0
  const totalMrp = items.reduce((sum, item) => sum + ((item.productId?.mrp || 0) * item.quantity), 0);
  const totalPrice = items.reduce((sum, item) => sum + ((item.productId?.salePrice || 0) * item.quantity), 0);
  const totalDiscount = totalMrp - totalPrice;
  
  // Apply delivery fee logic from settings
  const deliveryFeeSetting = settings?.deliveryFee ?? 40;
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 499;
  const deliveryCharges = totalPrice >= freeDeliveryThreshold ? 0 : deliveryFeeSetting;
  
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, totalPrice + deliveryCharges - couponDiscount);
  const totalSavings = totalDiscount + couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError('');
    
    try {
      const cartItemsForValidation = items.map(item => ({
        product: item.productId?._id,
        quantity: item.quantity,
        price: item.productId?.salePrice
      }));

      const res = await api.post('/coupons/validate', {
        code: couponCode,
        cartItems: cartItemsForValidation,
        cartTotal: totalPrice
      });

      if (res.data.success) {
        setAppliedCoupon({
          code: res.data.coupon.code,
          discount: res.data.discount
        });
        setCouponError('');
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left: Cart Items */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white border border-surface-border rounded-sm shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-surface-border bg-white flex justify-between items-center">
              <h1 className="font-medium text-lg text-text-primary">My Cart ({items.length})</h1>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                <span className="text-sm text-text-primary font-medium">Deliver to</span>
                <div className="flex border border-surface-border rounded-sm overflow-hidden">
                  <input type="text" className="w-24 px-2 py-1 text-sm outline-none font-bold" defaultValue="400001" />
                </div>
              </div>
            </div>

            {/* Items List */}
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
              </div>
            ) : items.length > 0 ? (
              <div className="divide-y divide-surface-border">
                {items.map(item => {
                  const product = item.productId;
                  if (!product?._id) return null;
                  const mrp = product.mrp || 0;
                  const salePrice = product.salePrice || 0;
                  const minQty = product.minOrderQty || 1;
                  const itemDiscount = mrp > 0 && mrp > salePrice ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;
                  const image = product.images && product.images.length > 0
                    ? (product.images[0].url || (product.images[0] as any))
                    : 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop';
                  
                  const stepQty = getStepQty(product, item.quantity);
                  const isLot = product.isLot;
                  const displayQty = isLot ? item.quantity / stepQty : item.quantity;
                  const displayPrice = isLot ? salePrice * stepQty : salePrice;
                  const displayMrp = isLot ? mrp * stepQty : mrp;

                  return (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-6">
                    {/* Item Image */}
                    <div className="w-full sm:w-28 shrink-0 flex flex-col items-center gap-4">
                      <div className="w-24 h-24 relative">
                        <Image src={image} alt={product.name} fill sizes="96px" className="object-contain" />
                      </div>
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-surface-border rounded-sm">
                        <button 
                          onClick={() => {
                            const step = getStepQty(product, item.quantity);
                            if (item.quantity <= step) {
                              removeFromCart(item.id);
                            } else {
                              updateQuantity(item.id, item.quantity - step);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center font-bold text-lg hover:bg-surface text-danger"
                          title={item.quantity <= stepQty ? 'Remove item' : 'Decrease quantity'}
                        >
                          {item.quantity <= stepQty ? (
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          ) : '-'}
                        </button>
                        <div className="w-10 h-8 flex items-center justify-center text-sm font-medium border-x border-surface-border">
                          {displayQty}
                        </div>
                        <button 
                          onClick={() => {
                            const step = getStepQty(product, item.quantity);
                            updateQuantity(item.id, item.quantity + step);
                          }}
                          className="w-8 h-8 flex items-center justify-center font-bold text-lg hover:bg-surface text-primary"
                        >+</button>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col">
                      <Link href={`/product/${product._id}`} className="text-text-primary font-medium hover:text-primary transition-colors pr-12">
                        {product.name}
                      </Link>
                      {item.variantName && (
                        <span className="text-xs text-primary font-medium mt-0.5">Variant: {item.variantName}</span>
                      )}
                      {item.selectedModel && (
                        <span className="text-xs text-blue-600 font-medium mt-0.5">Model: {item.selectedModel}</span>
                      )}
                      {isLot && (
                        <span className="text-xs text-accent font-medium mt-0.5">Lot Size: {stepQty} units</span>
                      )}
                      <span className="text-xs text-text-secondary mt-1 mb-3">Seller: Shibra</span>
                      
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-bold text-text-primary">₹{displayPrice.toLocaleString('en-IN')}</span>
                        {displayMrp > displayPrice && <span className="text-sm text-text-muted line-through">₹{displayMrp.toLocaleString('en-IN')}</span>}
                        {itemDiscount > 0 && <span className="text-sm font-bold text-success">{itemDiscount}% Off</span>}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Subtotal: <span className="font-bold text-text-primary">₹{(displayPrice * displayQty).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Item Actions */}
                      <div className="flex gap-6 mt-4 pt-4 border-t border-surface-border text-sm font-medium">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-danger hover:text-red-700 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-[64px] text-surface-border mb-4">production_quantity_limits</span>
                <h2 className="text-xl font-bold text-text-primary mb-2">Your cart is empty!</h2>
                <p className="text-text-secondary mb-6">Add items to it now.</p>
                <Link href="/" className="bg-primary text-white px-8 py-3 rounded-sm font-medium hover:bg-primary-dark transition-colors">
                  Shop Now
                </Link>
              </div>
            )}

            {/* Bottom Place Order Bar */}
            {items.length > 0 && !isLoading && (
              <div className="p-4 border-t border-surface-border bg-white flex justify-end sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Link href="/checkout" className="bg-accent text-white px-10 py-3 md:py-4 rounded-sm font-bold text-lg hover:bg-accent-dark transition-colors shadow-md w-full md:w-auto text-center">
                  PLACE ORDER
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Price Details */}
        {items.length > 0 && !isLoading && (
          <div className="w-full lg:w-1/3">
            {/* Coupons / Offers */}
            <div 
              onClick={() => setShowCouponInput(!showCouponInput)}
              className="bg-white border border-surface-border rounded-sm shadow-sm p-4 mb-4 flex justify-between items-center cursor-pointer group hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">local_offer</span>
                <span className="font-medium text-text-primary group-hover:text-primary">Apply Coupons</span>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">
                {showCouponInput ? 'expand_more' : 'chevron_right'}
              </span>
            </div>

            {showCouponInput && (
              <div className="bg-white border border-surface-border rounded-sm shadow-sm p-4 mb-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow border border-surface-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary uppercase"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode}
                    className="bg-primary text-white px-4 py-2 rounded-sm text-sm font-bold disabled:opacity-50 hover:bg-primary-dark transition-colors"
                  >
                    {isApplying ? 'APPLYING...' : 'APPLY'}
                  </button>
                </div>
                {couponError && <p className="text-error text-xs mt-2 font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-sm flex justify-between items-center">
                    <div>
                      <p className="text-success text-sm font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        &apos;{appliedCoupon.code}&apos; applied
                      </p>
                      <p className="text-success text-xs mt-0.5">You saved ₹{appliedCoupon.discount}</p>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-error text-xs font-bold hover:underline">REMOVE</button>
                  </div>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-white border border-surface-border rounded-sm shadow-sm sticky top-24">
              <div className="p-4 border-b border-surface-border">
                <h2 className="uppercase font-medium text-text-secondary text-sm">Price Details</h2>
              </div>
              <div className="p-4 space-y-4 text-text-primary">
                <div className="flex justify-between">
                  <span>Price ({items.length} items)</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>− ₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span>
                    <span>− ₹{appliedCoupon.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className={deliveryCharges === 0 ? "text-success" : ""}>
                    {deliveryCharges === 0 ? "Free Delivery" : `₹${deliveryCharges}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-surface-border pt-4 text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="p-4 bg-success/10 text-success text-sm font-medium rounded-b-sm border-t border-surface-border">
                You will save ₹{totalSavings.toLocaleString('en-IN')} on this order
              </div>
            </div>
            
            {/* Security Notice */}
            <div className="flex items-center gap-3 p-4 mt-4 text-text-secondary text-sm">
              <span className="material-symbols-outlined text-[32px] text-text-muted">verified_user</span>
              <p>Safe and Secure Payments. Easy returns. 100% Authentic products.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
