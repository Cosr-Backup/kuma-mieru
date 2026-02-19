import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { PreloadData } from '../types/config';
import { ConfigError } from './errors';
import { extractPreloadData } from './json-processor';
import { sanitizeJsonString, validatePreloadData } from './json-sanitizer';
import { normalizeBaseUrl } from './url';

type PreloadSource = 'script' | 'data-json';
type ResolvedPreloadSource = PreloadSource | 'legacy-window-preload' | 'api-fallback';

type MinimalResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

export interface PreloadExtractionResult {
  payload: string | null;
  source: PreloadSource | null;
}

export interface FetchPreloadDataOptions {
  baseUrl: string;
  pageId: string;
  fetchFn?: (url: string, init?: Record<string, unknown>) => Promise<MinimalResponse>;
  requestInit?: Record<string, unknown>;
}

export interface ApiPreloadResult {
  data: PreloadData;
  url: string;
}

export interface PreloadLogger {
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface ResolvePreloadDataFromHtmlOptions extends FetchPreloadDataOptions {
  html: string;
  logger?: PreloadLogger;
  includeHtmlDiagnostics?: boolean;
}

export interface ResolvedPreloadData {
  data: PreloadData;
  source: ResolvedPreloadSource;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

function ensureAcceptHeader(headers: Record<string, string>) {
  const hasAcceptHeader = Object.keys(headers).some(key => key.toLowerCase() === 'accept');
  if (!hasAcceptHeader) {
    headers.Accept = 'application/json';
  }
}

export function getPreloadPayload($: CheerioAPI): PreloadExtractionResult {
  const preloadElement = $('#preload-data');

  if (!preloadElement || preloadElement.length === 0) {
    return { payload: null, source: null };
  }

  const scriptContent = preloadElement.text()?.trim();
  if (scriptContent) {
    return { payload: scriptContent, source: 'script' };
  }

  const dataJson = preloadElement.attr('data-json');
  if (dataJson) {
    const trimmed = dataJson.trim();
    if (trimmed && trimmed !== '{}' && trimmed !== '[]') {
      return { payload: trimmed, source: 'data-json' };
    }
  }

  return { payload: null, source: null };
}

function parsePreloadPayload(payload: string): PreloadData {
  try {
    const jsonStr = sanitizeJsonString(payload);
    return extractPreloadData(jsonStr);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(
        `JSON parsing failed: ${error.message}\nProcessed data: ${payload.slice(0, 100)}...`,
        error
      );
    }

    if (error instanceof ConfigError) {
      throw error;
    }

    throw new ConfigError(
      `Failed to parse preload data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

function extractLegacyPreloadPayload($: CheerioAPI, logger: PreloadLogger): string | null {
  const scriptWithPreloadData = $('script:contains("window.preloadData")').text();
  if (!scriptWithPreloadData) {
    return null;
  }

  const match = scriptWithPreloadData.match(/window\.preloadData\s*=\s*({[\s\S]*?});/);
  if (match && match[1]) {
    logger.info?.('Successfully extracted preload data from window.preloadData');
    return match[1];
  }

  logger.error?.(
    'Failed to extract preload data with regex. Script content:',
    scriptWithPreloadData.slice(0, 200)
  );

  return null;
}

export async function resolvePreloadDataFromHtml({
  html,
  baseUrl,
  pageId,
  fetchFn,
  requestInit,
  logger = console,
  includeHtmlDiagnostics = false,
}: ResolvePreloadDataFromHtmlOptions): Promise<ResolvedPreloadData> {
  const $ = cheerio.load(html);
  const { payload: initialPayload, source } = getPreloadPayload($);

  let payload = initialPayload?.trim() ?? '';
  let resolvedSource: ResolvedPreloadSource | null = source;

  if (source === 'data-json') {
    logger.debug?.('Using preload data from data-json attribute');
  }

  if (!payload) {
    const legacyPayload = extractLegacyPreloadPayload($, logger);
    if (legacyPayload) {
      payload = legacyPayload;
      resolvedSource = 'legacy-window-preload';
    }
  }

  if (payload) {
    return {
      data: parsePreloadPayload(payload),
      source: resolvedSource ?? 'legacy-window-preload',
    };
  }

  logger.warn?.('Preload script missing, attempting status page API fallback');

  try {
    const apiFallback = await fetchPreloadDataFromApi({
      baseUrl,
      pageId,
      fetchFn,
      requestInit,
    });
    logger.info?.('Using status page API fallback for preload data', { url: apiFallback.url });
    return {
      data: apiFallback.data,
      source: 'api-fallback',
    };
  } catch (apiError) {
    logger.error?.('Status page API fallback failed:', apiError);
  }

  if (includeHtmlDiagnostics) {
    logger.error?.('HTML response preview:', html.slice(0, 500));
    logger.error?.(
      'Available script tags:',
      $('script')
        .map((_, el) => $(el).attr('id') || 'no-id')
        .get()
    );
  }

  throw new ConfigError('Preload script tag not found or empty');
}

export async function fetchPreloadDataFromApi({
  baseUrl,
  pageId,
  fetchFn,
  requestInit,
}: FetchPreloadDataOptions): Promise<ApiPreloadResult> {
  if (!baseUrl || !pageId) {
    throw new ConfigError('Base URL and page ID are required to fetch preload data from API');
  }

  const normalizedBase = normalizeBaseUrl(baseUrl);
  const url = `${normalizedBase}/api/status-page/${pageId}`;

  const normalizedHeaders = normalizeHeaders(requestInit?.headers as HeadersInit | undefined);
  ensureAcceptHeader(normalizedHeaders);

  const finalInit: Record<string, unknown> = {
    ...requestInit,
    headers: normalizedHeaders,
  };

  const effectiveFetch =
    fetchFn ??
    (async (input: string, init?: Record<string, unknown>) => fetch(input, init as RequestInit));

  let response: MinimalResponse;

  try {
    response = await effectiveFetch(url, finalInit);
  } catch (error) {
    throw new ConfigError('Failed to request preload data from API', error);
  }

  if (!response.ok) {
    throw new ConfigError(
      `Failed to fetch preload data from API: ${response.status} ${response.statusText}`
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (error) {
    throw new ConfigError('Failed to parse preload data API response as JSON', error);
  }

  if (!validatePreloadData(parsed)) {
    throw new ConfigError('Preload data API response is missing required fields');
  }

  return {
    data: parsed,
    url,
  };
}
