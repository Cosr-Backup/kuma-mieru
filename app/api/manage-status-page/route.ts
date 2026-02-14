import { getConfig } from '@/config/api';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const config = getConfig();

  if (!config || !config.isEditThisPage) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  const target = `${config.baseUrl.replace(/\/+$/, '')}/manage-status-page`;
  return NextResponse.redirect(target, 307);
}
