import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DocHook - Document Intelligence & RAG',
  description:
    'Grounding semantic search and QA on uploaded documents via MongoDB Vector Search and LangChain.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }, { url: '/favicon.ico' }],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-white text-[#0d0d0d] font-sans selection:bg-neutral-200 selection:text-black"
      >
        {children}
      </body>
    </html>
  );
}
