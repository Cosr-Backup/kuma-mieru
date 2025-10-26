'use client';

import type { Config } from '@/types/config';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface PageConfigContextValue {
  config: Config;
  setConfig: (config: Config) => void;
}

const PageConfigContext = createContext<PageConfigContextValue | null>(null);

interface PageConfigProviderProps {
  initialConfig: Config;
  children: React.ReactNode;
}

export function PageConfigProvider({ initialConfig, children }: PageConfigProviderProps) {
  const [config, setConfigState] = useState<Config>(initialConfig);

  const setConfig = useCallback((nextConfig: Config) => {
    setConfigState((prev) => {
      if (
        prev.pageId === nextConfig.pageId &&
        prev.apiEndpoint === nextConfig.apiEndpoint &&
        prev.htmlEndpoint === nextConfig.htmlEndpoint
      ) {
        return prev;
      }
      return nextConfig;
    });
  }, []);

  const value = useMemo<PageConfigContextValue>(() => ({ config, setConfig }), [config, setConfig]);

  return <PageConfigContext.Provider value={value}>{children}</PageConfigContext.Provider>;
}

export function usePageConfig(): Config {
  const context = useContext(PageConfigContext);
  if (!context) {
    throw new Error('usePageConfig must be used within a PageConfigProvider');
  }

  return context.config;
}

export function usePageConfigManager(): PageConfigContextValue {
  const context = useContext(PageConfigContext);
  if (!context) {
    throw new Error('usePageConfigManager must be used within a PageConfigProvider');
  }

  return context;
}

export function useSetPageConfig(): PageConfigContextValue['setConfig'] {
  const { setConfig } = usePageConfigManager();
  return setConfig;
}
