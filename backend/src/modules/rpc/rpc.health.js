export async function healthCheck(endpoint) {
  const started = Date.now();
  try {
    const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }), headers: { 'content-type': 'application/json' } });
    const ok = res.ok;
    return { ok, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: Date.now() - started };
  }
}
