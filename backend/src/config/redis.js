import Redis from 'ioredis';

let redis = null;

export function getRedis() {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redis = new Redis(url, { lazyConnect: true });
  return redis;
}
