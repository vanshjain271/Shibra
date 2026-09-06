import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Shibra Store',
  description: 'Get in touch with Shibra for support, inquiries, or any assistance regarding our mobile accessories.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
