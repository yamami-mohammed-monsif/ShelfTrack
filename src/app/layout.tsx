import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Using Geist as specified, consider specific Arabic fonts if needed
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'], // Added latin-ext for wider character support
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'], // Added latin-ext
});

export const metadata: Metadata = {
  title: 'متجر بوزيد', // Bouzid Store in Arabic
  description: 'تطبيق متجر بوزيد لإدارة المنتجات وتحليل المبيعات', // Bouzid Store app for product management and sales analysis
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
