'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useAddresses, useSettings } from '@/hooks/useApi';
import api from '@/lib/api';
import { event } from '@/components/MetaPixel';

interface AddressForm {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_FORM: AddressForm = { name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, openLoginModal } = useAuthStore();
  const { items, isLoading: isCartLoading, fetchCart, clearLocalCart } = useCartStore();
  const { addresses, mutate: mutateAddresses } = useAddresses();
  const { settings } = useSettings();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [utr, setUtr] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'RAZORPAY' | 'COD' | 'PARTIAL_COD'>('UPI');

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_FORM);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      fetchCart();
    }
  }, [isMounted, isAuthenticated, fetchCart, openLoginModal]);

  // Track InitiateCheckout once cart is loaded
  const hasTrackedCheckout = useRef(false);
  useEffect(() => {
    if (!isCartLoading && items.length > 0 && !hasTrackedCheckout.current) {
      const value = items.reduce((sum, item) => sum + ((item.productId?.salePrice || 0) * item.quantity), 0);
      const content_ids = items.map(item => item.productId?._id).filter(Boolean);
      event('InitiateCheckout', {
        value,
        currency: 'INR',
        content_ids,
        num_items: items.length
      });
      hasTrackedCheckout.current = true;
    }
  }, [isCartLoading, items]);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);

  const totalMrp = items.reduce((sum, item) => sum + ((item.productId?.mrp || 0) * item.quantity), 0);
  const totalPrice = items.reduce((sum, item) => sum + ((item.productId?.salePrice || 0) * item.quantity), 0);
  const totalDiscount = totalMrp - totalPrice;
  
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

  const deliveryFeeSetting = settings?.deliveryFee ?? 40;
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 499;
  const minOrderAmount = settings?.minOrderAmount ?? 0;
  const deliveryCharges = totalPrice >= freeDeliveryThreshold ? 0 : deliveryFeeSetting;
  
  const orderTotal = totalPrice + deliveryCharges;

  const upiId = settings?.upiId || 'shibra@upi';
  const advanceAmount = settings?.partialPaymentType === 'flat' 
    ? (settings?.partialPaymentFlatAmount || 0) 
    : Math.round(orderTotal * ((settings?.partialPaymentPercent || 0) / 100));
  const finalAdvance = advanceAmount > orderTotal ? orderTotal : advanceAmount;
  const restAmount = orderTotal - finalAdvance;

  const handleSaveAddress = async () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      setAddressError('Please fill all required fields');
      return;
    }
    setIsSavingAddress(true);
    setAddressError('');
    try {
      const res = await api.post('/addresses', addressForm);
      if (res.data.success) {
        await mutateAddresses();
        setSelectedAddress(res.data.data);
        setShowAddressForm(false);
        setAddressForm(EMPTY_FORM);
      }
    } catch (err: any) {
      setAddressError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address.');
      return;
    }
    if (totalPrice < minOrderAmount) {
      alert(`Minimum order value is ₹${minOrderAmount}`);
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId._id,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
        price: item.productId.salePrice,
      }));

      // Map frontend payment mode to backend accepted values
      let backendPaymentMode: any = paymentMode;
      if (paymentMode === 'UPI') backendPaymentMode = 'UPI_QR';
      if (paymentMode === 'PARTIAL_COD') backendPaymentMode = 'COD_PARTIAL';

      const res = await api.post('/orders', {
        items: orderItems,
        // Backend expects shippingAddressId (the _id of the saved address)
        shippingAddress: selectedAddress._id,
        paymentMode: backendPaymentMode,
        utr: paymentMode === 'UPI' || paymentMode === 'PARTIAL_COD' ? utr : undefined,
      });

      if (res.data.success) {
        event('Purchase', { 
          value: orderTotal, 
          currency: 'INR',
          content_ids: items.map(item => item.productId?._id).filter(Boolean),
          content_type: 'product',
          num_items: items.length
        });
        clearLocalCart();
        await fetchCart();
        router.push('/account');
      }
    } catch (error: any) {
      console.error('Failed to place order', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isCartLoading || !isAuthenticated) {
    return (
      <div className="bg-background min-h-screen pb-12 flex justify-center items-center">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen py-8 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary mb-4">Your cart is empty</h2>
        <Link href="/" className="bg-primary text-white px-8 py-3 rounded-sm font-medium hover:bg-primary-dark">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left: Checkout Steps */}
        <div className="w-full lg:w-2/3 space-y-4">
          
          {/* Step 1: Login (Completed) */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="bg-surface text-text-primary w-6 h-6 flex items-center justify-center rounded-sm font-bold text-xs">1</span>
                <div>
                  <h2 className="text-text-primary font-medium">LOGIN <span className="material-symbols-outlined text-primary text-[16px] align-middle ml-1">check_circle</span></h2>
                  <p className="text-sm text-text-secondary mt-1 font-medium">{user?.name || 'User'} <span className="mx-2">{user?.phone || ''}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm">
            <div className={`p-4 flex items-center gap-4 ${step === 1 ? 'bg-primary text-white rounded-t-sm' : ''}`}>
              <span className={`${step === 1 ? 'bg-white text-primary' : 'bg-surface text-text-primary'} w-6 h-6 flex items-center justify-center rounded-sm font-bold text-xs`}>2</span>
              <h2 className={`font-medium ${step === 1 ? 'text-white' : 'text-text-primary'}`}>DELIVERY ADDRESS</h2>
            </div>
            
            {step === 1 && (
              <div className="p-6 border-t border-surface-border space-y-4">
                {/* Existing addresses */}
                {addresses && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr: any) => (
                      <label key={addr._id} className={`flex gap-4 items-start border rounded p-4 cursor-pointer transition-colors ${selectedAddress?._id === addr._id ? 'bg-primary/5 border-primary/30' : 'border-surface-border hover:border-primary/20'}`}>
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddress?._id === addr._id}
                          onChange={() => setSelectedAddress(addr)}
                          className="mt-1 accent-primary" 
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-text-primary">{addr.name}</span>
                            <span className="text-sm text-text-secondary">{addr.phone}</span>
                          </div>
                          <p className="text-sm text-text-primary mt-1 leading-relaxed">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add address button */}
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full border border-dashed border-primary/40 rounded p-4 flex items-center gap-3 text-primary font-medium cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span> Add a new address
                  </button>
                ) : (
                  <div className="border border-surface-border rounded p-4 space-y-3">
                    <h3 className="font-medium text-text-primary">New Delivery Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text" placeholder="Full Name *" value={addressForm.name}
                        onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="tel" placeholder="Phone Number *" value={addressForm.phone}
                        onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="text" placeholder="Address Line 1 *" value={addressForm.addressLine1}
                        onChange={e => setAddressForm(f => ({ ...f, addressLine1: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-2"
                      />
                      <input
                        type="text" placeholder="Address Line 2 (optional)" value={addressForm.addressLine2}
                        onChange={e => setAddressForm(f => ({ ...f, addressLine2: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-2"
                      />
                      <input
                        type="text" placeholder="City *" value={addressForm.city}
                        onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="text" placeholder="State *" value={addressForm.state}
                        onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="text" placeholder="Pincode *" value={addressForm.pincode}
                        onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value }))}
                        className="border border-surface-border rounded px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    {addressError && <p className="text-red-500 text-xs">{addressError}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveAddress}
                        disabled={isSavingAddress}
                        className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {isSavingAddress ? 'SAVING...' : 'SAVE ADDRESS'}
                      </button>
                      <button
                        onClick={() => { setShowAddressForm(false); setAddressForm(EMPTY_FORM); setAddressError(''); }}
                        className="text-text-secondary text-sm font-medium hover:text-text-primary px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {selectedAddress && !showAddressForm && (
                  <button 
                    onClick={() => setStep(2)}
                    className="mt-2 bg-accent text-white px-8 py-3 rounded-sm font-bold shadow hover:bg-accent-dark transition-colors"
                  >
                    DELIVER HERE
                  </button>
                )}
              </div>
            )}
            {step > 1 && (
              <div className="px-14 pb-4">
                <p className="text-sm text-text-primary font-medium">
                  {selectedAddress?.name} <span className="font-normal text-text-secondary mx-2">{selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode}</span>
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Order Summary */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm">
            <div className={`p-4 flex items-center gap-4 ${step === 2 ? 'bg-primary text-white rounded-t-sm' : ''}`}>
              <span className={`${step === 2 ? 'bg-white text-primary' : 'bg-surface text-text-primary'} w-6 h-6 flex items-center justify-center rounded-sm font-bold text-xs`}>3</span>
              <h2 className={`font-medium ${step === 2 ? 'text-white' : 'text-text-primary'}`}>ORDER SUMMARY</h2>
            </div>
            {step === 2 && (
              <div>
                <div className="p-4 border-t border-surface-border">
                  {items.map(item => {
                    const product = item.productId;
                    if (!product?._id) return null;
                    const salePrice = product.salePrice || 0;
                    const mrp = product.mrp || 0;
                    
                    const stepQty = getStepQty(product, item.quantity);
                    const isLot = product.isLot;
                    const displayQty = isLot ? item.quantity / stepQty : item.quantity;
                    const displayPrice = isLot ? salePrice * stepQty : salePrice;
                    const displayMrp = isLot ? mrp * stepQty : mrp;

                    return (
                    <div key={item.id} className="flex justify-between items-start mt-6 pt-6 border-t border-surface-border first:mt-0 first:pt-0 first:border-0">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-surface rounded border border-surface-border overflow-hidden shrink-0 p-1">
                          {product.images && product.images[0] ? (
                            <img src={product.images[0].url || (product.images[0] as any)} alt={product.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Img</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">{product.name}</h3>
                          {item.variantName && <p className="text-xs text-primary mt-0.5">Variant: {item.variantName}</p>}
                          {item.selectedModel && <p className="text-xs text-blue-600 mt-0.5">Model: {item.selectedModel}</p>}
                          {isLot && <p className="text-xs text-accent mt-0.5">Lot Size: {stepQty} units</p>}
                          <p className="text-sm text-text-secondary mt-1">Qty: {displayQty}</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-bold text-text-primary">₹{displayPrice.toLocaleString('en-IN')}</span>
                            {displayMrp > displayPrice && <span className="text-sm text-text-muted line-through">₹{displayMrp.toLocaleString('en-IN')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-text-primary text-right">
                        ₹{(displayPrice * displayQty).toLocaleString('en-IN')}
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-white border-t border-surface-border flex flex-col justify-between items-center gap-4">
                  {settings?.minOrderAmount && totalPrice < settings.minOrderAmount && (
                    <div className="w-full p-3 bg-red-50 text-red-600 rounded text-sm font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      Minimum order amount is ₹{settings.minOrderAmount}. Please add more items.
                    </div>
                  )}
                  <div className="w-full flex justify-between items-center">
                    <p className="text-sm text-text-primary">Order confirmation sent to <span className="font-medium">{user?.phone}</span></p>
                    <button 
                      disabled={!!(settings?.minOrderAmount && totalPrice < settings.minOrderAmount)}
                      onClick={() => setStep(3)}
                      className="bg-accent text-white px-8 py-3 rounded-sm font-bold shadow hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              </div>
            )}
            {step > 2 && (
              <div className="px-14 pb-4">
                <p className="text-sm text-text-primary font-medium">{items.length} Items · <span className="text-text-secondary">₹{orderTotal.toLocaleString('en-IN')}</span></p>
              </div>
            )}
          </div>

          {/* Step 4: Payment Options */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm">
            <div className={`p-4 flex items-center gap-4 ${step === 3 ? 'bg-primary text-white rounded-t-sm' : ''}`}>
              <span className={`${step === 3 ? 'bg-white text-primary' : 'bg-surface text-text-primary'} w-6 h-6 flex items-center justify-center rounded-sm font-bold text-xs`}>4</span>
              <h2 className={`font-medium ${step === 3 ? 'text-white' : 'text-text-primary'}`}>PAYMENT OPTIONS</h2>
            </div>
            {step === 3 && (
              <div className="p-0 border-t border-surface-border">

                {/* Checkout Note */}
                {settings?.cartNote && (
                  <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-sm whitespace-pre-line">
                    {settings.cartNote}
                  </div>
                )}

                {/* UPI / QR Option */}
                <div className={`p-4 border-b border-surface-border ${paymentMode === 'UPI' ? 'bg-primary/5' : ''}`}>
                  <label className="flex items-center gap-4 cursor-pointer font-medium text-text-primary">
                    <input type="radio" name="payment" checked={paymentMode === 'UPI'} onChange={() => setPaymentMode('UPI')} className="w-4 h-4 accent-primary" />
                    UPI (Google Pay, PhonePe, Paytm)
                  </label>
                  {paymentMode === 'UPI' && (
                    <div className="ml-8 mt-4 bg-white p-6 rounded border border-surface-border flex flex-col md:flex-row items-center gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-40 h-40 bg-surface border border-surface-border p-2 rounded-lg flex items-center justify-center">
                          {settings?.paymentQrCode ? (
                            <img src={settings.paymentQrCode} alt="Payment QR Code" className="w-full h-full object-contain" />
                          ) : (
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${upiId}&pn=Shibra&am=${orderTotal}&cu=INR`} alt="UPI QR Code" width={150} height={150} />
                          )}
                        </div>
                        <span className="text-xs text-text-secondary font-medium">Scan with any UPI app</span>
                      </div>
                      <div className="flex-grow w-full">
                        <p className="text-sm text-text-primary mb-4 leading-relaxed">
                          1. Scan the QR code using any UPI app.<br/>
                          2. Pay exactly <strong className="text-lg">₹{orderTotal.toLocaleString('en-IN')}</strong>.<br/>
                          3. Enter the 12-digit UTR / Reference number below.
                        </p>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Enter 12-digit UTR Number"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="w-full border border-surface-border rounded-sm px-4 py-3 outline-none focus:border-primary focus:ring-1 ring-primary text-sm"
                          />
                          <button
                            disabled={isPlacingOrder || !utr || !!(settings?.minOrderAmount && totalPrice < settings.minOrderAmount)}
                            onClick={handlePlaceOrder}
                            className="w-full md:w-auto bg-accent text-white px-8 py-3 rounded-sm font-bold shadow hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPlacingOrder ? 'PLACING ORDER...' : 'CONFIRM ORDER'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Partial Payment Option */}
                {settings?.advancePartialPayment && (
                  <div className={`p-4 border-b border-surface-border ${paymentMode === 'PARTIAL_COD' ? 'bg-primary/5' : ''}`}>
                    <label className="flex items-center gap-4 cursor-pointer font-medium text-text-primary">
                      <input type="radio" name="payment" checked={paymentMode === 'PARTIAL_COD'} onChange={() => setPaymentMode('PARTIAL_COD')} className="w-4 h-4 accent-primary" />
                      Partial Payment (Advance + COD)
                    </label>
                    {paymentMode === 'PARTIAL_COD' && (
                      <div className="ml-8 mt-4 bg-white p-6 rounded border border-surface-border flex flex-col md:flex-row items-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-40 h-40 bg-surface border border-surface-border p-2 rounded-lg flex items-center justify-center">
                            {settings?.paymentQrCode ? (
                              <img src={settings.paymentQrCode} alt="Payment QR Code" className="w-full h-full object-contain" />
                            ) : (
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${upiId}&pn=Shibra&am=${finalAdvance}&cu=INR`} alt="UPI QR Code" width={150} height={150} />
                            )}
                          </div>
                          <span className="text-xs text-text-secondary font-medium">Scan with any UPI app</span>
                        </div>
                        <div className="flex-grow w-full">
                          <p className="text-sm text-text-primary mb-4 leading-relaxed">
                            1. Scan the QR code using any UPI app.<br/>
                            2. Pay exactly <strong className="text-lg">₹{finalAdvance.toLocaleString('en-IN')}</strong> right now.<br/>
                            3. Pay the remaining <strong className="text-lg">₹{restAmount.toLocaleString('en-IN')}</strong> on Cash on Delivery.<br/>
                            4. Enter the 12-digit UTR / Reference number below.
                          </p>
                          <div className="space-y-4">
                            <input
                              type="text"
                              placeholder="Enter 12-digit UTR Number"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              className="w-full border border-surface-border rounded-sm px-4 py-3 outline-none focus:border-primary focus:ring-1 ring-primary text-sm"
                            />
                            <button
                              disabled={isPlacingOrder || !utr || !!(settings?.minOrderAmount && totalPrice < settings.minOrderAmount)}
                              onClick={handlePlaceOrder}
                              className="w-full md:w-auto bg-accent text-white px-8 py-3 rounded-sm font-bold shadow hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPlacingOrder ? 'PLACING ORDER...' : 'CONFIRM ORDER'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cash on Delivery Option */}
                <div className={`p-4 ${!settings?.codEnabled ? 'opacity-60 cursor-not-allowed' : paymentMode === 'COD' ? 'bg-primary/5' : ''}`}>
                  <label className="flex items-center gap-4 cursor-pointer font-medium text-text-primary">
                    <input type="radio" name="payment" disabled={!settings?.codEnabled} checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} className="w-4 h-4 accent-primary" />
                    <div className="flex items-center gap-3">
                      <span>Cash on Delivery</span>
                      {!settings?.codEnabled && <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Coming Soon</span>}
                    </div>
                  </label>
                  {settings?.codEnabled && paymentMode === 'COD' && (
                    <div className="ml-8 mt-4">
                      {settings?.advancePartialPayment && (
                        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm">
                          {settings.partialPaymentType === 'flat' ? (
                            `Note: We highly recommend using Partial Payment instead, as a ₹${settings.partialPaymentFlatAmount || 0} advance may be required to process this order.`
                          ) : (
                            `Note: We highly recommend using Partial Payment instead, as a ${settings.partialPaymentPercent || 0}% advance may be required to process this order.`
                          )}
                        </div>
                      )}
                      {settings?.minOrderAmount && totalPrice < settings.minOrderAmount && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700 font-medium flex items-start gap-2">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                          <span>Minimum order value is ₹{settings.minOrderAmount}. Please add more items.</span>
                        </div>
                      )}
                      <button
                        disabled={isPlacingOrder || !!(settings?.minOrderAmount && totalPrice < settings.minOrderAmount)}
                        onClick={handlePlaceOrder}
                        className="w-full md:w-auto mt-4 bg-accent text-white px-8 py-3 rounded-sm font-bold shadow hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPlacingOrder ? 'PLACING ORDER...' : 'PLACE COD ORDER'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right: Price Details (Sticky) */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white border border-surface-border rounded-sm shadow-sm sticky top-24">
            <div className="p-4 border-b border-surface-border">
              <h2 className="uppercase font-medium text-text-secondary text-sm">Price Details</h2>
            </div>
            <div className="p-4 space-y-4 text-text-primary">
              <div className="flex justify-between">
                <span>Price ({items.length} items)</span>
                <span>₹{totalMrp.toLocaleString('en-IN')}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>− ₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className={deliveryCharges === 0 ? 'text-success' : ''}>{deliveryCharges === 0 ? 'Free' : `₹${deliveryCharges}`}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-surface-border pt-4 text-lg font-bold">
                <span>Amount Payable</span>
                <span>₹{orderTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {totalDiscount > 0 && (
              <div className="p-4 bg-success/10 text-success text-sm font-medium rounded-b-sm border-t border-surface-border">
                You will save ₹{totalDiscount.toLocaleString('en-IN')} on this order
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 p-4 mt-4 text-text-secondary text-sm">
            <span className="material-symbols-outlined text-[32px] text-text-muted">security</span>
            <p>Safe and Secure Payments. Easy returns. 100% Authentic products.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
