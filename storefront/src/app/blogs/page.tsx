'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await api.get('/blogs');
        setBlogs(res.data?.data || res.data?.blogs || []);
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Our Blog</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-surface-border rounded-lg">
            <h3 className="text-xl font-medium text-text-primary mb-2">No blogs yet</h3>
            <p className="text-text-secondary">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog._id} className="bg-surface rounded-lg shadow-sm border border-surface-border overflow-hidden hover:shadow-md transition-shadow">
                {blog.featuredImage && (
                  <div className="h-48 overflow-hidden relative">
                    <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-text-primary mb-3 line-clamp-2">{blog.title}</h2>
                  <p className="text-text-secondary mb-4 line-clamp-3">{blog.excerpt}</p>
                  <Link href={`/blogs/${blog.slug}`} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                    Read More
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
