import { API_BASE_URL } from '../config/api';

const CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  ts: number;
};

const levelCache = new Map<string, CacheEntry<number>>();
const newsListCache = new Map<string, CacheEntry<any[]>>();

function isFresh(entry?: CacheEntry<unknown>) {
  return !!entry?.data && Date.now() - entry.ts < CACHE_TTL_MS;
}

export function getCachedOverallLevel(userEmail: string | null) {
  const key = userEmail || 'guest';
  const cached = levelCache.get(key);
  return isFresh(cached) ? cached?.data ?? null : null;
}

export async function fetchOverallLevel(userEmail: string | null) {
  if (!userEmail) return 2;

  const key = userEmail;
  const cached = levelCache.get(key);
  if (isFresh(cached)) return cached?.data ?? 2;
  if (cached?.promise) return cached.promise;

  const promise = fetch(`${API_BASE_URL}/quiz/level/${encodeURIComponent(userEmail)}`)
    .then(res => res.json())
    .then(data => data?.overall_level ?? 2)
    .catch(() => 2);

  levelCache.set(key, { promise, ts: Date.now() });
  const level = await promise;
  levelCache.set(key, { data: level, ts: Date.now() });
  return level;
}

export function getCachedNewsList(level: number) {
  const key = String(level);
  const cached = newsListCache.get(key);
  return isFresh(cached) ? cached?.data ?? null : null;
}

export async function fetchNewsList(level: number) {
  const key = String(level);
  const cached = newsListCache.get(key);
  if (isFresh(cached)) return cached?.data ?? [];
  if (cached?.promise) return cached.promise;

  const promise = fetch(`${API_BASE_URL}/news/?level=${level}`).then(res => res.json());
  newsListCache.set(key, { promise, ts: Date.now() });
  const list = await promise;
  newsListCache.set(key, { data: Array.isArray(list) ? list : [], ts: Date.now() });
  return Array.isArray(list) ? list : [];
}
