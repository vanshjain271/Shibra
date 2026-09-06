'use client';

import { useSettings } from '@/hooks/useApi';

export default function ContactPage() {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen pb-12 flex justify-center items-center">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="bg-primary-dark text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg">
          Have a question or need assistance? We're here to help!
        </p>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Get in Touch</h2>
            <p className="text-text-secondary mb-8">
              Fill out the form or reach us out via the contact information below.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg">Head Office</h3>
                <p className="text-text-secondary mt-1 whitespace-pre-line">
                  {settings?.contactAddress || 'Gitamandir Ahmedabad'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">call</span>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg">Phone Number</h3>
                <p className="text-text-secondary mt-1">
                  <a href={`tel:${settings?.contactPhone || '+917428143728'}`} className="hover:text-accent transition-colors">
                    {settings?.contactPhone || '+91 88668 47353'}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary mb-1">Email Us</h3>
                <a href={`mailto:${settings?.contactEmail || 'arbudaaccessories@gmail.com'}`} className="hover:text-accent transition-colors">
                  {settings?.contactEmail || 'arbudaaccessories@gmail.com'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-surface p-8 rounded-xl border border-border shadow-sm">
          <h3 className="text-xl font-bold text-text-primary mb-6">Send a Message</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
                <input type="text" className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
                <input type="text" className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
              <textarea rows={4} className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="How can we help you?"></textarea>
            </div>
            <button type="button" className="w-full bg-primary text-white py-3 rounded-md font-bold hover:bg-primary-dark transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
