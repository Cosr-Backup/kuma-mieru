import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { StatusPage } from '@/components/status/StatusPage';
import { getAvailablePageIds, getConfig } from '@/config/api';
import { getGlobalConfig } from '@/services/config.server';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const defaultConfig = getConfig();

  if (!defaultConfig) {
    return [];
  }

  return getAvailablePageIds()
    .filter((pageId) => pageId !== defaultConfig.defaultPageId)
    .map((pageId) => ({ pageId }));
}

export default async function StatusPageRoute({
  params,
}: {
  params: { pageId: string };
}) {
  const pageConfig = getConfig(params.pageId);

  if (!pageConfig) {
    notFound();
  }

  const { config: footerConfig } = await getGlobalConfig(pageConfig.pageId);

  return (
    <PageConfigProvider initialConfig={pageConfig}>
      <AppShell footerConfig={footerConfig}>
        <StatusPage />
      </AppShell>
    </PageConfigProvider>
  );
}
