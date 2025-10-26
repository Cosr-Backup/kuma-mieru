'use client';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/basic/navbar';
import type { SiteConfig } from '@/types/config';

interface AppShellProps {
  children: React.ReactNode;
  footerConfig?: SiteConfig;
}

export function AppShell({ children, footerConfig }: AppShellProps) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-4 px-6 grow">{children}</main>
      <Footer config={footerConfig} />
    </div>
  );
}
