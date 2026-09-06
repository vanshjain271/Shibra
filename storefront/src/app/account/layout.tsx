import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | Shibra Store',
  description: 'Manage your Shibra account, view order history, update your profile, and track your shipments.',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
