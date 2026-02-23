import { buildStatusPageMetadata } from '@/app/lib/site-metadata';
import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { StatusPage } from '@/components/status/StatusPage';
import { assertPageAvailability } from '@/app/lib/page-health';
import { getConfig, toPublicConfig } from '@/config/api';
import { getGlobalConfig, getPageTabsMetadataResult } from '@/services/config.server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }> | { pageId: string };
}): Promise<Metadata> {
  const { pageId } = await params;
  return buildStatusPageMetadata(getConfig(pageId));
}

export default async function StatusPageRoute({
  params,
}: {
  params: Promise<{ pageId: string }> | { pageId: string };
}) {
  const { pageId } = await params;
  const pageConfig = getConfig(pageId);

  if (!pageConfig) {
    notFound();
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
