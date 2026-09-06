'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { signInWithPopup, ConfirmationResult } from 'firebase/auth';

export default function AuthModal() {
  const router = useRouter();
  const { isLoginModalOpen, closeLoginModal, setAuth, isAuthenticated, openLoginModal } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  // Auto-open login modal on site load if not authenticated
  useEffect(() => {
    const checkAuth = () => {
      if (!useAuthStore.getState().isAuthenticated) {
        openLoginModal();
      }
    };
    // Check after a brief delay to ensure Zustand has hydrated from localStorage
    const timeout = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isLoginModalOpen && auth) {
      const timer = setTimeout(() => {
        if (!recaptchaVerifier.current) {
          try {
            recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible'
            });
          } catch (err) {
            console.error('Failed to initialize recaptcha:', err);
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (recaptchaVerifier.current) {
          try {
            recaptchaVerifier.current.clear();
          } catch (e) {}
          recaptchaVerifier.current = null;
        }
      };
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const resetModal = () => {
    setPhone('');
    setName('');
    setEmail('');
    setPincode('');
    setOtp('');
    setStep('form');
    setError('');
    setConfirmationResult(null);
  };

  const handleClose = () => {
    // If we want to force login, we shouldn't let unauthenticated users close the modal
    if (!isAuthenticated) return;
    
    resetModal();
    closeLoginModal();
  };

  const processFirebaseToken = async (idToken: string) => {
    try {
      const res = await api.post('/auth/firebase-login', { idToken });
      
      if (res.data.success) {
        const { token, user, isNewUser } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        let updatedUser = user;

        // If in signup mode, update the newly created profile with the extra fields
        if (mode === 'signup' && phone) {
          try {
            const profileRes = await api.put('/users/me', { name, email });
            if (profileRes.data.success) {
              updatedUser = profileRes.data.user;
            }
          } catch (profileErr) {
            console.error('Failed to update profile after signup:', profileErr);
          }
        }

        setAuth(token, updatedUser);
        
        // Use standard close logic now that we are authenticated
        resetModal();
        closeLoginModal();
        
        // Redirect to complete profile ONLY if this is a brand new user
        if (isNewUser) {
          router.push('/complete-profile');
        }
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Server error during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !pincode.trim()) {
        setError('Please fill all details to create your account.');
        return;
      }
    }
    
    if (!auth || !recaptchaVerifier.current) {
      setError('Authentication service is currently unavailable.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    if (!confirmationResult) {
      setError('No OTP session found. Please request a new OTP.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken(true);
      await processFirebaseToken(idToken);
    } catch (err: any) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setError('Google Sign-In is currently unavailable.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);
      await processFirebaseToken(idToken);
    } catch (err: any) {
      console.error(err);
      // Only show error if they didn't just close the popup
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      {/* Invisible Recaptcha Container */}
      <div id="recaptcha-container"></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Close Button - Hide if forced login */}
        {isAuthenticated && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white relative">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">
              {step === 'form' ? 'person' : 'sms'}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {step === 'form' ? (mode === 'login' ? 'Welcome Back' : 'Create an Account') : 'Verify OTP'}
          </h2>
          <p className="text-white/80 text-sm">
            {step === 'form' 
              ? (mode === 'login' ? 'Login to access your orders and wishlist' : 'Sign up for a professional wholesale experience')
              : `OTP sent to +91 ${phone}`
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg mb-5 border border-danger/20 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {step === 'form' ? (
            <div className="space-y-6">
              <form onSubmit={handleSendOtp} className="space-y-5">
                
                {/* Professional Toggle */}
                <div className="flex rounded-lg bg-gray-100 p-1 mb-2">
                  <button 
                    type="button" 
                    onClick={() => { setMode('login'); setError(''); }} 
                    className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-colors ${mode === 'login' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Log In
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setMode('signup'); setError(''); }} 
                    className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-colors ${mode === 'signup' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sign Up
                  </button>
                </div>

                <p className="text-center text-sm font-medium text-gray-500 mb-2">
                  {mode === 'login' ? 'Already have an account?' : 'New Customer?'}
                </p>

                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Full Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full border-2 border-surface-border rounded-lg px-4 py-3 text-text-primary outline-none focus:border-primary transition-colors bg-white"
                        required={mode === 'signup'}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Email Address</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                        className="w-full border-2 border-surface-border rounded-lg px-4 py-3 text-text-primary outline-none focus:border-primary transition-colors bg-white"
                        required={mode === 'signup'}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Mobile Number</label>
                  <div className="flex items-center border-2 border-surface-border rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                    <span className="px-3 py-3 bg-surface text-text-secondary font-medium text-sm border-r border-surface-border">+91</span>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit number"
                      className="flex-1 px-4 py-3 text-text-primary outline-none text-base bg-white"
                      required
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Pincode</label>
                    <input 
                      type="text" 
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 110001"
                      className="w-full border-2 border-surface-border rounded-lg px-4 py-3 text-text-primary outline-none focus:border-primary transition-colors bg-white"
                      required={mode === 'signup'}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || phone.length < 10 || (mode === 'signup' && (!name || !email || pincode.length < 6))}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3.5 rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (mode === 'signup' ? 'CREATE ACCOUNT' : 'GET OTP')}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase block">Enter OTP</label>
                  <button 
                    type="button" 
                    onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                    className="text-primary text-xs font-semibold hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full border-2 border-surface-border rounded-lg px-4 py-3 text-text-primary outline-none focus:border-primary transition-colors text-2xl tracking-[0.5em] font-bold text-center bg-white"
                  autoFocus
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || otp.length < 6} // Firebase OTP is usually 6 digits
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3.5 rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying...
                  </>
                ) : (mode === 'signup' ? 'VERIFY & CREATE' : 'VERIFY & LOGIN')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
