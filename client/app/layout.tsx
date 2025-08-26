import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NeonAuthProvider } from '@/src/components/providers/NeonAuthProvider';
import { Toaster } from 'sonner';
import Header from '@/src/components/navigation/Header';
import Background from '@/src/components/ui/Background';
import DebugAuthState from '@/src/components/DebugAuthState';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gowra',
  description:
    'A modern event management system built with Next.js and Stack Auth',
  icons: {
    icon: [{ url: '/assets/G.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Background />
        <NeonAuthProvider>
          <Header />
          <main>{children}</main>
          <Toaster position="top-right" />
          {/* <DebugAuthState /> */}
        </NeonAuthProvider>
      </body>
    </html>
  );
}
