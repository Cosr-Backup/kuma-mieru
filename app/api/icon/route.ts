import { getConfig } from '@/config/api';
import { getUpstreamIconUrl } from '@/services/config.server';
import { customFetch } from '@/services/utils/fetch';
import { normalizeBaseUrl } from '@/utils/url';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FALLBACK_ICON = '/icon.svg';
const MAX_ICON_SIZE = 2 * 1024 * 1024; // 2MB

function resolveUpstreamIconUrl(icon: string, baseUrl: string): string | null {
  if (!icon || icon === FALLBACK_ICON || icon.startsWith('data:')) return null;

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const baseOrigin = new URL(normalizedBaseUrl).origin;

  if (/^https?:\/\//i.test(icon)) {
    const parsed = new URL(icon);
    if (parsed.origin !== baseOrigin) return null;
    return parsed.toString();
  }

  if (icon.startsWith('//')) return null;

  return `${normalizedBaseUrl}/${icon.replace(/^\/+/, '')}`;
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
    const icon = await getUpstreamIconUrl(pageConfig);
    if (!icon) {
      return fallback(request);
    }

    const targetUrl = resolveUpstreamIconUrl(icon, pageConfig.baseUrl);
    if (!targetUrl) {
      return fallback(request);
    }

    const upstreamResponse = await customFetch(targetUrl, {
      headers: { Accept: 'image/*,*/*;q=0.8' },
      timeout: 10000,
    });

    if (!upstreamResponse.ok) {
      return fallback(request);
    }

    const contentType = upstreamResponse.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
      return fallback(request);
    }

    const contentLength = Number(upstreamResponse.headers['content-length'] || '0');
    if (contentLength > MAX_ICON_SIZE) {
      return fallback(request);
    }

    const data = await upstreamResponse.arrayBuffer();
    if (data.byteLength > MAX_ICON_SIZE) {
      return fallback(request);
    }

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
