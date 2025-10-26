import { createApiResponse } from '@/app/lib/api-utils';
import { getGlobalConfig } from '@/services/config.server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') ?? undefined;

  return createApiResponse(() => getGlobalConfig(pageId ?? undefined), {
    maxAge: 60,
    revalidate: 30,
  });
}
