import { title } from '@/components/basic/primitives';
import { PageConfigProvider } from '@/components/context/PageConfigContext';
import { AppShell } from '@/components/layout/AppShell';
import { getConfig } from '@/config/api';
import { getGlobalConfig, getPageTabsMetadata } from '@/services/config.server';

export default async function AboutPage() {
  const pageConfig = getConfig();

  if (!pageConfig) {
    throw new Error('Failed to resolve default status page configuration');
  }

  const [{ config: footerConfig }, pageTabs] = await Promise.all([
    getGlobalConfig(pageConfig.pageId),
    getPageTabsMetadata(),
  ]);

  return (
    <PageConfigProvider initialConfig={pageConfig}>
      <AppShell footerConfig={footerConfig} pageTabs={pageTabs}>
        <div>
          <h1 className={title()}>About</h1>
        </div>
      </AppShell>
    </PageConfigProvider>
  );
}
