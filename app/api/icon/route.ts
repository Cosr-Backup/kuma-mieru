import { getConfig } from '@/config/api';
import { getPreloadData } from '@/services/config.server';
import { customFetch } from '@/services/utils/fetch';
import { NextResponse } from 'next/server';

const FALLBACK_ICON = '/icon.svg';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function resolveUpstreamIconUrl(icon: string, baseUrl: string): string | null {
  const trimmedIcon = icon.trim();
  if (!trimmedIcon) return null;
  if (trimmedIcon === FALLBACK_ICON) return null;
  if (trimmedIcon.startsWith('data:')) return null;

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const baseOrigin = new URL(normalizedBaseUrl).origin;

  if (/^https?:\/\//i.test(trimmedIcon)) {
    const parsed = new URL(trimmedIcon);
    if (parsed.origin !== baseOrigin) {
      return null;
    }
    return parsed.toString();
  }

  if (trimmedIcon.startsWith('//')) {
    return null;
  }

  return `${normalizedBaseUrl}/${trimmedIcon.replace(/^\/+/, '')}`;
}

function fallback(request: Request): NextResponse {
  return NextResponse.redirect(new URL(FALLBACK_ICON, request.url), 307);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPageId = searchParams.get('pageId') ?? undefined;

  const pageConfig = getConfig(requestedPageId) ?? getConfig();
  if (!pageConfig) {
    return fallback(request);
  }

  try {
    const preloadData = await getPreloadData(pageConfig);
    const icon = preloadData.config?.icon;
    if (typeof icon !== 'string') {
      return fallback(request);
    }

    const targetUrl = resolveUpstreamIconUrl(icon, pageConfig.baseUrl);
    if (!targetUrl) {
      return fallback(request);
    }

    const upstreamResponse = await customFetch(targetUrl, {
      headers: {
        Accept: 'image/*,*/*;q=0.8',
      },
      timeout: 10000,
    });

    if (!upstreamResponse.ok) {
      return fallback(request);
    }

    const contentType = upstreamResponse.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
      return fallback(request);
    }

    const data = await upstreamResponse.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to proxy icon', {
      pageId: pageConfig.pageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback(request);
  }
}
