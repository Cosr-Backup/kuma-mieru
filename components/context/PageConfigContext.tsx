'use client';

import type { Config } from '@/types/config';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

const PageConfigContext = createContext<Config | null>(null);

interface PageConfigProviderProps {
  initialConfig: Config;
  children: ReactNode;
}

export function PageConfigProvider({ initialConfig, children }: PageConfigProviderProps) {
  const value = useMemo(() => initialConfig, [initialConfig]);

  return <PageConfigContext.Provider value={value}>{children}</PageConfigContext.Provider>;
}

export function usePageConfig(): Config {
  const config = useContext(PageConfigContext);

  if (!config) {
    throw new Error('usePageConfig must be used within a PageConfigProvider');
  }

  return config;
}
