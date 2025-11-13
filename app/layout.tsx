import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | History Timelines',
    default: 'History Timelines - Interactive Historical Timelines & Events',
  },
  description: 'Explore comprehensive interactive timelines of historical events, civilizations, and key figures. Deep dive into the Aztec Empire, Hun conquests, and more.',
  keywords: ['history', 'timeline', 'historical events', 'civilizations', 'world history'],
  authors: [{ name: 'History Timelines' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'History Timelines',
    title: 'History Timelines - Interactive Historical Timelines & Events',
    description: 'Explore comprehensive interactive timelines of historical events, civilizations, and key figures.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'History Timelines',
    description: 'Explore comprehensive interactive timelines of historical events',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
