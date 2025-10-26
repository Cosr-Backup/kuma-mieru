import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { MonitorDetailContent } from '@/components/monitor/MonitorDetailContent';
import { getConfig } from '@/config/api';
import { getGlobalConfig } from '@/services/config.server';
import { notFound } from 'next/navigation';

export default async function MonitorDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pageId?: string };
}) {
  const requestedPageId = searchParams.pageId;
  const pageConfig = requestedPageId ? getConfig(requestedPageId) : getConfig();

  if (!pageConfig) {
    notFound();
  }

  const { config: footerConfig } = await getGlobalConfig(pageConfig.pageId);

  return (
    <PageConfigProvider initialConfig={pageConfig}>
      <AppShell footerConfig={footerConfig}>
        <MonitorDetailContent monitorId={params.id} />
      </AppShell>
    </PageConfigProvider>
  );
}
