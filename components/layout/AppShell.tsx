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
  const failedTabs = (pageTabs ?? []).filter(tab => tab.health === 'unavailable');
  const hasPartialFailure = failedTabs.length > 0 && failedTabs.length < (pageTabs?.length ?? 0);

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <PageTabs tabs={pageTabs} />
      {hasPartialFailure ? (
        <div className="container mx-auto max-w-7xl px-6 pt-4">
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-700">
            Some status pages are unavailable: {failedTabs.map(tab => tab.id).join(', ')}
          </div>
        </div>
      ) : null}
      <main key={pageId} className="container mx-auto max-w-7xl pt-4 px-6 grow fade-in-soft">
        {children}
      </main>
      <Footer config={footerConfig} />
    </div>
  );
}
