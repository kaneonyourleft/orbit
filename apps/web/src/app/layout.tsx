import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ORBIT | Workspace OS',
  description: 'The Notion-style workspace for modern teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans bg-white text-zinc-900 antialiased min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
