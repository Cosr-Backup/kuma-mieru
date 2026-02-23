import '@/styles/globals.css';
import { clsx } from 'clsx';
import type { Metadata, Viewport } from 'next';

import Analytics from '@/components/basic/google-analytics';
import { buildDefaultMetadata } from '@/app/lib/site-metadata';
import { fontMono, fontSans } from '@/config/fonts';
import { getGlobalConfig, getPageTabsMetadataResult } from '@/services/config.server';
import { isSsrStrictMode } from '@/services/utils/common';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from './providers';
import { assertGlobalAvailability } from './lib/page-health';

import { Toaster } from 'sonner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildDefaultMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Parallel fetch i18n data and global config to reduce waiting time
  const [locale, messages, { config }, pageTabsResult] = await Promise.all([
    getLocale(),
    getMessages(),
    getGlobalConfig(),
    getPageTabsMetadataResult(),
  ]);

  assertGlobalAvailability(
    pageTabsResult.matrix,
    pageTabsResult.tabs,
    pageTabsResult.tabs.length,
    isSsrStrictMode
  );

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
