import { buildStatusPageMetadata } from '@/app/lib/site-metadata';
import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { StatusPage } from '@/components/status/StatusPage';
import { assertPageAvailability } from '@/app/lib/page-health';
import { getConfig, toPublicConfig } from '@/config/api';
import { getGlobalConfig, getPageTabsMetadataResult } from '@/services/config.server';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  const pageConfig = getConfig();
  return buildStatusPageMetadata(pageConfig);
}

export default async function HomePage() {
  const pageConfig = getConfig();

  if (!pageConfig) {
    throw new Error('Failed to resolve default status page configuration');
  }

  const [{ config: footerConfig }, pageTabsResult] = await Promise.all([
    getGlobalConfig(pageConfig.pageId),
    getPageTabsMetadataResult(),
  ]);

  assertPageAvailability(pageTabsResult.tabs, pageConfig.pageId);

  return (
    <PageConfigProvider key={pageConfig.pageId} initialConfig={toPublicConfig(pageConfig)}>
      <AppShell footerConfig={footerConfig} pageTabs={pageTabsResult.tabs}>
        <StatusPage />
      </AppShell>
    </PageConfigProvider>
  );
}
