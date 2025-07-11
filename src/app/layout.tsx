import type { Metadata } from 'next';
import { AuthProvider } from '@/shared/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Care & Service Platform',
  description: 'Professional care services marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 