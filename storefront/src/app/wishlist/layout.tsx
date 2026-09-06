import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Shibra Store',
  description: 'View and manage your favorite mobile accessories and products saved to your Shibra wishlist.',
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
