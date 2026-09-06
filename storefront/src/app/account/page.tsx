'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrders, useAddresses, useWishlist, useMyReviews } from '@/hooks/useApi';
import api, { API_BASE_URL } from '@/lib/api';
import HoverZoomImage from '@/components/product/HoverZoomImage';

const getOrderStatusDisplay = (status: string) => {
  switch (status) {
    case 'PENDING': return { text: 'Payment Pending', color: 'text-yellow-600 bg-yellow-50 border border-yellow-200' };
    case 'PROCESSING_PAYMENT': return { text: 'Processing Payment', color: 'text-yellow-600 bg-yellow-50 border border-yellow-200' };
    case 'PAID':
    case 'CONFIRMED': return { text: 'Order Confirmed', color: 'text-success bg-success/10 border border-success/20' };
    case 'PACKED': return { text: 'Packed', color: 'text-success bg-success/10 border border-success/20' };
    case 'SHIPPED': return { text: 'Shipped', color: 'text-primary bg-primary/10 border border-primary/20' };
    case 'DELIVERED': return { text: 'Delivered', color: 'text-success bg-success/10 border border-success/20' };
    case 'PAYMENT_FAILED': return { text: 'Payment Failed', color: 'text-danger bg-danger/10 border border-danger/20' };
    case 'CANCELLED': return { text: 'Cancelled', color: 'text-text-secondary bg-surface border border-surface-border' };
    default: return { text: status, color: 'text-text-secondary bg-surface border border-surface-border' };
  }
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, openLoginModal, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders');
  const { orders, isLoading: isLoadingOrders } = useOrders();
  const { addresses, mutate: mutateAddresses } = useAddresses();
  const { wishlist, isLoading: isLoadingWishlist, mutate: mutateWishlist } = useWishlist();
  const { reviews: myReviews, isLoading: isLoadingReviews, mutate: mutateReviews } = useMyReviews();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) {
      openLoginModal();
    }
  }, [isMounted, isAuthenticated, openLoginModal]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const res = await api.put('/users/me', { name, email });
      if (res.data.success) {
        alert("Profile updated successfully!");
        updateUser({ name, email });
      }
    } catch (error: any) {
      console.error("Failed to update profile", error);
      alert(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingAddressId) {
        await api.patch(`/addresses/${editingAddressId}`, addressForm);
        alert('Address updated!');
      } else {
        await api.post('/addresses', addressForm);
        alert('Address added!');
      }
      mutateAddresses();
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      mutateAddresses();
    } catch (error: any) {
      alert('Failed to delete address');
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      name: addr.name || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || ''
    });
    setShowAddressForm(true);
  };
  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await api.post('/users/wishlist', { productId: id });
      mutateWishlist();
    } catch (error) {
      console.error('Failed to remove from wishlist');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-background min-h-screen pb-12 flex justify-center items-center">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* User Info */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Hello,</p>
              <h2 className="font-bold text-text-primary">{user?.name || 'User'}</h2>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white border border-surface-border rounded-sm shadow-sm overflow-hidden">
            
            {/* Orders */}
            <div className="border-b border-surface-border">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors ${activeTab === 'orders' ? 'text-primary bg-primary/5' : 'text-text-secondary'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                  <span className={`font-medium ${activeTab === 'orders' ? 'text-primary font-bold' : 'text-text-secondary'}`}>MY ORDERS</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Account Settings */}
            <div className="border-b border-surface-border">
              <div className="flex items-center gap-4 p-4 text-text-secondary">
                <span className="material-symbols-outlined text-[22px]">person</span>
                <span className="font-bold text-text-secondary">ACCOUNT SETTINGS</span>
              </div>
              <div className="flex flex-col">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`text-left pl-14 pr-4 py-3 text-sm hover:text-primary transition-colors ${activeTab === 'profile' ? 'text-primary font-medium bg-primary/5' : 'text-text-primary'}`}
                >
                  Profile Information
                </button>
                <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`text-left pl-14 pr-4 py-3 text-sm hover:text-primary transition-colors ${activeTab === 'addresses' ? 'text-primary font-medium bg-primary/5' : 'text-text-primary'}`}
                >
                  Manage Addresses
                </button>
              </div>
            </div>

            {/* My Stuff */}
            <div className="border-b border-surface-border">
              <div className="flex items-center gap-4 p-4 text-text-secondary">
                <span className="material-symbols-outlined text-[22px]">folder</span>
                <span className="font-bold text-text-secondary">MY STUFF</span>
              </div>
              <div className="flex flex-col">
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className={`text-left pl-14 pr-4 py-3 text-sm hover:text-primary transition-colors ${activeTab === 'wishlist' ? 'text-primary font-medium bg-primary/5' : 'text-text-primary'}`}
                >
                  My Wishlist
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`text-left pl-14 pr-4 py-3 text-sm hover:text-primary transition-colors ${activeTab === 'reviews' ? 'text-primary font-medium bg-primary/5' : 'text-text-primary'}`}
                >
                  My Reviews & Ratings
                </button>
              </div>
            </div>

            {/* Logout */}
            <div>
              <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-text-secondary hover:bg-primary/5 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[22px]">power_settings_new</span>
                <span className="font-bold text-text-secondary hover:text-primary transition-colors">LOGOUT</span>
              </button>
            </div>

          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-grow">
          <div className="bg-white border border-surface-border rounded-sm shadow-sm h-full min-h-[500px]">
            
            {/* Orders View */}
            {activeTab === 'orders' && (
              <div>
                <div className="p-4 border-b border-surface-border flex justify-between items-center">
                  <h1 className="font-medium text-lg text-text-primary">My Orders</h1>
                  <div className="flex items-center bg-surface border border-surface-border rounded-sm px-3 py-1">
                    <span className="material-symbols-outlined text-text-muted text-[18px]">search</span>
                    <input type="text" placeholder="Search your orders here" className="bg-transparent outline-none text-sm px-2 w-48" />
                  </div>
                </div>
                
                {/* Orders List */}
                {isLoadingOrders ? (
                  <div className="p-12 flex justify-center">
                    <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
                  </div>
                ) : orders.length > 0 ? (
                  orders.map((order: any) => {
                    const statusDisplay = getOrderStatusDisplay(order.status);
                    return (
                    <div key={order._id} className="p-4 border-b border-surface-border hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-text-secondary font-medium">Order ID: {order.orderNumber}</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open(`${API_BASE_URL}/invoices/public-pdf/${order._id}`, '_blank'); }}
                            className="text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">download</span>
                            Invoice
                          </button>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${statusDisplay.color}`}>
                            {statusDisplay.text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {order.items.map((item: any) => {
                          const product = item.product;
                          const image = product?.images && product.images.length > 0 ? (product.images[0].url || product.images[0]) : 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop';
                          return (
                            <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 relative bg-surface rounded p-1 shrink-0">
                                  <Image src={image} alt="Product" fill sizes="64px" className="object-contain" />
                                </div>
                                <div>
                                  <Link href={`/product/${product?._id}`}>
                                    <h3 className="text-sm font-medium text-text-primary max-w-sm line-clamp-2 hover:text-primary transition-colors">
                                      {product?.name}
                                    </h3>
                                  </Link>
                                  <p className="text-xs text-text-secondary mt-1">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              
                              <div className="font-medium text-text-primary whitespace-nowrap">
                                ₹{item.price?.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-surface-border flex justify-between items-center">
                        <span className="text-sm font-bold">Total: ₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-text-secondary">Ordered on {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                  })
                ) : (
                  <div className="p-12 text-center text-text-secondary flex flex-col items-center">
                    <span className="material-symbols-outlined text-[48px] mb-4">production_quantity_limits</span>
                    <p>No orders found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile View */}
            {activeTab === 'profile' && (
              <div className="p-8 max-w-2xl">
                <h1 className="font-medium text-lg text-text-primary mb-6">Personal Information</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-xs text-text-secondary font-medium uppercase mb-1 block">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-surface-border rounded-sm px-4 py-2 bg-surface text-text-primary outline-none focus:border-primary" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <h2 className="font-medium text-lg text-text-primary mb-6">Email Address</h2>
                <div className="mb-8">
                  <input 
                    type="email" 
                    className="w-full md:w-1/2 border border-surface-border rounded-sm px-4 py-2 bg-surface text-text-primary outline-none focus:border-primary" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <h2 className="font-medium text-lg text-text-primary mb-6">Mobile Number</h2>
                <div className="mb-8">
                  <input 
                    type="tel" 
                    className="w-full md:w-1/2 border border-surface-border rounded-sm px-4 py-2 bg-surface/50 text-text-secondary outline-none cursor-not-allowed" 
                    value={user?.phone || ''} 
                    disabled 
                  />
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-sm shadow hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            )}

            {/* Addresses View */}
            {activeTab === 'addresses' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="font-medium text-lg text-text-primary">Manage Addresses</h1>
                  {!showAddressForm && (
                    <button 
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({
                          name: '', phone: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: ''
                        });
                        setShowAddressForm(true);
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-sm text-sm font-bold shadow hover:bg-primary-dark transition-colors"
                    >
                      + ADD NEW ADDRESS
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <div className="bg-surface/50 border border-surface-border rounded p-6 mb-6">
                    <h2 className="font-bold text-text-primary mb-4">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>
                    <form onSubmit={handleSaveAddress}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <input type="text" placeholder="Name" required value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                        <div>
                          <input type="text" placeholder="10-digit mobile number" required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                        <div>
                          <input type="text" placeholder="Pincode" required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                        <div>
                          <input type="text" placeholder="Locality / Landmark" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <textarea placeholder="Address (Area and Street)" required value={addressForm.addressLine1} onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})} rows={3} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm"></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <input type="text" placeholder="City/District/Town" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                        <div>
                          <input type="text" placeholder="State" required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full border border-surface-border rounded-sm px-4 py-2 outline-none focus:border-primary text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button type="submit" disabled={isSaving} className="bg-primary text-white font-bold px-8 py-3 rounded-sm shadow hover:bg-primary-dark transition-colors disabled:opacity-50">
                          {isSaving ? 'SAVING...' : 'SAVE'}
                        </button>
                        <button type="button" onClick={() => setShowAddressForm(false)} className="text-primary font-bold px-8 py-3 hover:bg-surface rounded-sm transition-colors">
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.length > 0 ? addresses.map((addr: any) => (
                      <div key={addr._id} className="border border-surface-border rounded p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-bold text-text-primary text-sm">{addr.name}</span>
                            <span className="font-bold text-text-primary text-sm">{addr.phone}</span>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
                            {addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}
                            {addr.landmark ? addr.landmark + ', ' : ''}
                            {addr.city}, {addr.state} - <span className="font-medium text-text-primary">{addr.pincode}</span>
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 ml-4">
                          <button onClick={() => handleEditAddress(addr)} className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">EDIT</button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-text-secondary hover:text-error transition-colors text-sm font-medium">DELETE</button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-text-secondary">No addresses saved yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist View */}
            {activeTab === 'wishlist' && (
              <div className="p-8">
                <h1 className="font-medium text-lg text-text-primary mb-6">My Wishlist ({wishlist?.length || 0})</h1>
                
                {isLoadingWishlist ? (
                  <div className="flex justify-center p-12">
                    <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
                  </div>
                ) : wishlist && wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item: any) => {
                      const image = item.images && item.images.length > 0 ? (item.images[0].url || item.images[0]) : 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop';
                      const discount = Math.round(((item.mrp - item.salePrice) / item.mrp) * 100);
                      
                      return (
                        <div key={item._id} className="border border-surface-border rounded-sm hover:shadow-lg transition-shadow bg-white flex flex-col group relative overflow-hidden">
                          <button 
                            onClick={() => handleRemoveFromWishlist(item._id)}
                            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white border border-surface-border flex items-center justify-center text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove from wishlist"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                          
                          <Link href={`/product/${item._id}`} className="w-full aspect-square relative p-4 border-b border-surface-border block">
                            <HoverZoomImage 
                              src={image} 
                              alt={item.name} 
                              scale={2}
                              className="w-full h-full"
                              imageClassName="p-4" 
                            />
                          </Link>
                          
                          <div className="p-4 flex flex-col flex-grow">
                            <Link href={`/product/${item._id}`} className="text-sm font-medium text-text-primary hover:text-primary transition-colors line-clamp-2 mb-2">
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="bg-success text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                {item.averageRating || 0} <span className="material-symbols-outlined text-[10px]">star</span>
                              </div>
                              <span className="text-text-secondary text-xs font-medium">
                                ({item.totalReviews || 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-auto pt-2">
                              <span className="font-bold text-text-primary">₹{(item.salePrice || 0).toLocaleString('en-IN')}</span>
                              <span className="text-xs text-text-muted line-through">₹{(item.mrp || 0).toLocaleString('en-IN')}</span>
                              <span className="text-xs font-bold text-success">{discount}% off</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-[64px] text-surface-border mb-4">favorite_border</span>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Empty Wishlist</h2>
                    <p className="text-text-secondary mb-6">You have no items in your wishlist. Start adding!</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews View */}
            {['reviews'].includes(activeTab) && (
              <div className="p-4 md:p-8">
                <h2 className="font-bold text-text-primary mb-6 text-xl">My Reviews & Ratings</h2>
                {isLoadingReviews ? (
                  <div className="flex justify-center items-center py-20">
                    <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
                  </div>
                ) : myReviews.length > 0 ? (
                  <div className="space-y-6">
                    {myReviews.map((review: any) => (
                      <div key={review._id} className="border border-surface-border rounded-lg p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <Link href={`/product/${review.product?._id}`} className="flex items-center gap-4 group">
                            {review.product?.images?.[0] && (
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-surface flex-shrink-0">
                                <Image src={review.product.images[0]?.url || review.product.images[0]} alt={review.product.name} width={64} height={64} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{review.product?.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="bg-success text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  {review.rating} <span className="material-symbols-outlined text-[10px]">star</span>
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${review.status === 'APPROVED' ? 'bg-success/10 text-success' : review.status === 'REJECTED' ? 'bg-danger/10 text-danger' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {review.status}
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="text-xs text-text-muted text-right">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        
                        {review.title && <h4 className="font-bold text-text-primary mb-2">{review.title}</h4>}
                        <p className="text-sm text-text-secondary leading-relaxed mb-4">{review.comment}</p>
                        
                        {review.adminReply && (
                          <div className="bg-surface rounded-md p-4 mt-4 border border-surface-border relative">
                            <span className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-bold text-primary uppercase tracking-wider">Shibra Support</span>
                            <p className="text-sm text-text-secondary">{review.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-[64px] text-surface-border mb-4">rate_review</span>
                    <h2 className="text-xl font-bold text-text-primary mb-2">No Reviews Yet</h2>
                    <p className="text-text-secondary mb-6">You haven't reviewed any products yet. Share your experience to help others!</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
