'use client';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/basic/navbar';
import { PageTabs } from '@/components/basic/page-tabs';
import { usePageConfig } from '@/components/context/PageConfigContext';
import type { SiteConfig } from '@/types/config';
import type { PageTabMeta } from '@/types/page';

interface AppShellProps {
  children: React.ReactNode;
  footerConfig?: SiteConfig;
  pageTabs?: PageTabMeta[];
}

export function AppShell({ children, footerConfig, pageTabs }: AppShellProps) {
  const { pageId } = usePageConfig();

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <PageTabs tabs={pageTabs} />
      <main key={pageId} className="container mx-auto max-w-7xl pt-4 px-6 grow fade-in-soft">
        {children}
      </main>
      <Footer config={footerConfig} />
    </div>
  );
}
