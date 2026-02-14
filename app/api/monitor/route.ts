import { createApiResponse } from '@/app/lib/api-utils';
import { getMonitoringData } from '@/services/monitor.server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') ?? undefined;

  return createApiResponse(async () => getMonitoringData(pageId ?? undefined), {
    maxAge: 60, // Cache for 1 minute
    revalidate: 30,
  });
}
