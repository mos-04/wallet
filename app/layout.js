'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { useSession } from 'next-auth/react';

function RootLayoutContent({ children }) {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      {session && <Navbar />}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
      <footer className="text-center text-gray-500 text-sm p-4">
        <p>POS System © 2025 - Kuwait Sales Management</p>
      </footer>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>POS System</title>
      </head>
      <body>
        <SessionProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}
