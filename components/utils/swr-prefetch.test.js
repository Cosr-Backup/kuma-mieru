import { afterEach, expect, test } from 'bun:test';
import { prefetchSWRKey } from './swr';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('prefetchSWRKey skips repeated requests within the ttl window', async () => {
  let calls = 0;
  const key = `/api/prefetch-test-${crypto.randomUUID()}`;

  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ success: true });
  };

  await expect(prefetchSWRKey(key, { ttlMs: 30_000 })).resolves.toBe(true);
  await expect(prefetchSWRKey(key, { ttlMs: 30_000 })).resolves.toBe(false);
  expect(calls).toBe(1);
});

test('prefetchSWRKey limits speculative requests to one in flight request', async () => {
  let releaseFetch;
  const firstKey = `/api/prefetch-slow-${crypto.randomUUID()}`;
  const secondKey = `/api/prefetch-skip-${crypto.randomUUID()}`;

  globalThis.fetch = async () => {
    await new Promise(resolve => {
      releaseFetch = resolve;
    });

    return Response.json({ success: true });
  };

  const firstPrefetch = prefetchSWRKey(firstKey, { ttlMs: 30_000 });

  await expect(prefetchSWRKey(secondKey, { ttlMs: 30_000 })).resolves.toBe(false);

  releaseFetch?.();
  await expect(firstPrefetch).resolves.toBe(true);
});
