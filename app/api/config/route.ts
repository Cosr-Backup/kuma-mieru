import { createApiResponse } from '@/app/lib/api-utils';
import { getConfig } from '@/config/api';
import { getGlobalConfig } from '@/services/config.server';
import { buildIconProxyUrl } from '@/utils/icon-proxy';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') ?? undefined;
  const resolvedConfig = getConfig(pageId) ?? getConfig();

  return createApiResponse(
    async () => {
      const data = await getGlobalConfig(pageId ?? undefined);
      const resolvedPageId = resolvedConfig?.pageId;

      return {
        ...data,
        config: {
          ...data.config,
          icon: buildIconProxyUrl(resolvedPageId),
        },
      };
    },
    {
      maxAge: 60,
      revalidate: 30,
    }
  );
}
