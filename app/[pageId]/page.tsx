import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { StatusPage } from '@/components/status/StatusPage';
import { getConfig, toPublicConfig } from '@/config/api';
import { getGlobalConfig, getPageTabsMetadata } from '@/services/config.server';
import { notFound } from 'next/navigation';

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

  const [{ config: footerConfig }, pageTabs] = await Promise.all([
    getGlobalConfig(pageConfig.pageId),
    getPageTabsMetadata(),
  ]);

  return (
    <PageConfigProvider key={pageConfig.pageId} initialConfig={toPublicConfig(pageConfig)}>
      <AppShell footerConfig={footerConfig} pageTabs={pageTabs}>
        <StatusPage />
      </AppShell>
    </PageConfigProvider>
  );
}
