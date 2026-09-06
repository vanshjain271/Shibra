'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

interface BulkInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function BulkInquiryModal({ isOpen, onClose, product }: BulkInquiryModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [quantity, setQuantity] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !quantity) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Submit to Backend
      await api.post('/inquiries', {
        productId: product._id,
        name,
        phone,
        quantity: parseInt(quantity, 10)
      });

      // 2. Redirect to WhatsApp
      const adminWhatsApp = '919662302860';
      const text = `Hello Shibra,\n\nI want to make a bulk inquiry.\n\n*Product:* ${product.name}\n*Quantity:* ${quantity} units\n*My Name:* ${name}\n*My Phone:* ${phone}\n\nPlease let me know the best price.`;
      const waUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
      
      window.open(waUrl, '_blank');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Bulk Inquiry</h2>
          <p className="text-white/80 text-sm">Get the best wholesale price for {product.name}</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4 border border-danger/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-surface-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border-2 border-surface-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Quantity Required</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border-2 border-surface-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 rounded-lg shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <>
                  <span className="material-symbols-outlined">chat</span>
                  Submit & Open WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
