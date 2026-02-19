import { title } from '@/components/basic/primitives';
import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { assertPageAvailability } from '@/app/lib/page-health';
import { getConfig, toPublicConfig } from '@/config/api';
import { getGlobalConfig, getPageTabsMetadataResult } from '@/services/config.server';

export default async function AboutPage() {
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
    <PageConfigProvider initialConfig={toPublicConfig(pageConfig)}>
      <AppShell footerConfig={footerConfig} pageTabs={pageTabsResult.tabs}>
        <div>
          <h1 className={title()}>About</h1>
        </div>
      </AppShell>
    </PageConfigProvider>
  );
}
