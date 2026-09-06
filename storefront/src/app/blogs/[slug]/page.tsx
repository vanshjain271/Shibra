'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function SingleBlogPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchBlog = async () => {
      try {
        const res = await api.get(`/blogs/${slug}`);
        setBlog(res.data?.data || res.data?.blog);
      } catch (err) {
        console.error('Failed to fetch blog', err);
        router.push('/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-background min-h-screen py-20 flex justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Blog not found</h2>
          <Link href="/blogs" className="text-primary hover:underline">Return to all blogs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-primary/5 py-16 border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">{blog.title}</h1>
          <div className="flex items-center justify-center gap-4 text-text-secondary text-sm">
            {blog.author?.name && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">person</span>
                {blog.author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {new Date(blog.createdAt || blog.publishedAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {blog.featuredImage && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-sm border border-surface-border">
            <img src={blog.featuredImage} alt={blog.title} className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none text-text-primary prose-headings:text-text-primary prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
        />
        
        <div className="mt-16 pt-8 border-t border-surface-border flex items-center justify-between">
          <Link href="/blogs" className="text-primary font-medium hover:underline flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Blogs
          </Link>
          
          {/* Social Share (Placeholder) */}
          <div className="flex items-center gap-4 text-text-secondary">
            <span className="text-sm font-medium">Share:</span>
            <button className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
