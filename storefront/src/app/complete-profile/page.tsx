'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If not authenticated at all, go to home
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    // If authenticated and has all details, go to home
    if (user?.name && user?.email && user?.phone) {
      router.push('/');
      return;
    }

    // Pre-fill existing details
    if (user) {
      let strippedPhone = user.phone || '';
      if (strippedPhone.startsWith('+91')) {
        strippedPhone = strippedPhone.substring(3);
      }
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: strippedPhone,
      });
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('All fields are required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`
      };
      const res = await api.put('/users/me', payload);
      if (res.data.success) {
        // Update user context
        setAuth(useAuthStore.getState().token || '', res.data.user);
        router.push('/'); // Go back to home
      } else {
        setError(res.data.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || (user?.name && user?.email && user?.phone)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-surface-border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Complete Your Profile</h2>
          <p className="text-sm text-text-secondary mt-2">
            Please provide your details to continue shopping.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-6 border border-red-100 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!!user?.name && user.name.trim() !== ''}
              className="w-full border border-surface-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!!user?.email && user.email.trim() !== ''}
              className="w-full border border-surface-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g. john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-surface-border bg-surface text-text-secondary text-sm">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!!user?.phone && user.phone.trim() !== ''}
                className="flex-1 min-w-0 block w-full border border-surface-border rounded-none rounded-r-lg px-4 py-2.5 focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="10-digit mobile number"
                maxLength={10}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold text-sm transition-colors mt-8 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {loading ? 'SAVING...' : 'SAVE & CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  );
}
