const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED = 5;
const state = new Map();

function keyOf(ip, username) {
  return `${ip}::${username}`;
}

export function getRiskState(ip, username) {
  const now = Date.now();
  const key = keyOf(ip, username);
  const item = state.get(key);
  if (!item) return { locked: false, retryAfterSec: 0 };

  if (item.lockUntil && item.lockUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((item.lockUntil - now) / 1000) };
  }

  if (item.lockUntil && item.lockUntil <= now) {
    state.delete(key);
  }

  return { locked: false, retryAfterSec: 0 };
}

export function markLoginFailed(ip, username) {
  const now = Date.now();
  const key = keyOf(ip, username);
  const item = state.get(key) || { count: 0, firstFailAt: now, lockUntil: 0 };

  if (now - item.firstFailAt > LOCK_WINDOW_MS) {
    item.count = 0;
    item.firstFailAt = now;
  }

  item.count += 1;

  if (item.count >= MAX_FAILED) {
    item.lockUntil = now + LOCK_WINDOW_MS;
  }

  state.set(key, item);
  return getRiskState(ip, username);
}

export function markLoginSuccess(ip, username) {
  state.delete(keyOf(ip, username));
}
