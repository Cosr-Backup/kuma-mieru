import '@/styles/globals.css';
import { clsx } from 'clsx';
import type { Metadata, Viewport } from 'next';

import Analytics from '@/components/basic/google-analytics';
import { fontMono, fontSans } from '@/config/fonts';
import { getConfig } from '@/config/api';
import packageJson from '@/package.json';
import { getGlobalConfig } from '@/services/config.server';
import { buildIconProxyUrl } from '@/utils/icon-proxy';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from './providers';

import { Toaster } from 'sonner';

const DEFAULT_TITLE = 'Kuma Mieru';
const DEFAULT_DESCRIPTION = 'A beautiful and modern uptime monitoring dashboard';
const DEFAULT_ICON = '/icon.svg';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const config = getConfig();
  const resolvedTitle = config?.siteMeta.title?.trim() || DEFAULT_TITLE;
  const resolvedDescription = config?.siteMeta.description?.trim() || DEFAULT_DESCRIPTION;
  const resolvedIcons =
    config?.pageIds && config.pageIds.length > 0
      ? config.pageIds.map(pageId => buildIconProxyUrl(pageId))
      : [DEFAULT_ICON];

  return {
    title: {
      default: resolvedTitle,
      template: `%s - ${resolvedTitle}`,
    },
    description: resolvedDescription,
    icons: {
      icon: resolvedIcons,
    },
    generator: `https://github.com/Alice39s/kuma-mieru v${packageJson.version}`,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Parallel fetch i18n data and global config to reduce waiting time
  const [locale, messages, { config }] = await Promise.all([
    getLocale(),
    getMessages(),
    getGlobalConfig(),
  ]);

  const { theme, googleAnalyticsId } = config;

  return (
    <html suppressHydrationWarning={true} lang={locale}>
      <head />
      <body
        className={clsx(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        {googleAnalyticsId && <Analytics id={googleAnalyticsId} />}
        <Providers
          locale={locale}
          messages={messages}
          themeProps={{ attribute: 'class', defaultTheme: theme }}
        >
          <div className="min-h-screen bg-background">
            {children}
            <Toaster position="top-center" richColors />
          </div>
        </Providers>
      </body>
    </html>
  );
}
