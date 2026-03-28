import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-zinc-900 font-sans antialiased min-h-full flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
