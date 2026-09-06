/**
 * Blog Service
 * 
 * Mocked for now as backend lacks blog routes
 */

export interface Blog {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  category: string;
  readTime: string;
  publishedAt: string;
}

class BlogService {
  private mockBlogs: Blog[] = [
    {
      _id: 'blog1',
      title: 'Top 10 Business Strategies for 2024',
      excerpt: 'Discover the most effective strategies to scale your retail business this year.',
      content: `In the rapidly evolving retail landscape, staying ahead of the curve is crucial. 
      This article explores ten key strategies that successful businesses are using in 2024.
      
      1. Digital First Approach: Customer behavior has shifted permanently towards digital channels.
      2. Personalization: Using data to offer tailored recommendations is no longer optional.
      3. Supply Chain Resilience: Diversifying suppliers ensures consistency even during global disruptions.
      
      Scaling a business requires a delicate balance of innovation and operational excellence. 
      Shibra is committed to providing the tools you need to succeed in this journey.`,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
      author: 'Admin',
      category: 'Business',
      readTime: '5 min',
      publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      _id: 'blog2',
      title: 'The Future of Indian E-commerce',
      excerpt: 'How local businesses are transforming the digital marketplace in India.',
      content: `The Indian e-commerce market is expected to grow by 25% annually. 
      This growth is driven by increasing smartphone penetration and digital literacy.
      
      Local manufacturers are now reaching global audiences through platforms like Shibra. 
      We are seeing a surge in "Make in India" products across categories like electronics and home decor.
      
      Challenges still exist in logistics for Tier 3 cities, but infrastructure is improving fast. 
      Join the revolution and take your retail business online today.`,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop',
      author: 'Expert Team',
      category: 'Insights',
      readTime: '4 min',
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      _id: 'blog3',
      title: 'Managing Inventory Like a Pro',
      excerpt: 'Optimize your stock levels and reduce holding costs with these simple tips.',
      content: `Inventory management is the backbone of any successful retail operation. 
      Poor management leads to stockouts or excessive holding costs.
      
      Tips for 2024:
      - Use JIT (Just in Time) inventory for fast-moving items.
      - Regular auditing prevents shrinkage and errors.
      - Invest in automated systems to track real-time stock levels.
      
      Shibra provides an integrated dashboard for our sellers to manage their inventory seamlessly. 
      Sign up today to access advanced business tools.`,
      image: 'https://images.unsplash.com/photo-1553413077-190dd30c871c?q=80&w=2370&auto=format&fit=crop',
      author: 'Logistic Guru',
      category: 'Operations',
      readTime: '6 min',
      publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    }
  ];

  async getBlogs(): Promise<Blog[]> {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.mockBlogs), 800);
    });
  }

  async getBlogById(id: string): Promise<Blog | null> {
    const blog = this.mockBlogs.find(b => b._id === id);
    return new Promise((resolve) => {
      setTimeout(() => resolve(blog || null), 500);
    });
  }
}

export const blogService = new BlogService();
