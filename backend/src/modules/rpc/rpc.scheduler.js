import prisma from '../../config/db.js';
import { healthCheck } from './rpc.health.js';

export async function runRpcHealthCheck() {
  const nodes = await prisma.rpcNode.findMany();
  for (const node of nodes) {
    const result = await healthCheck(node.endpoint);
    await prisma.rpcHealthLog.create({ data: { nodeId: node.id, success: result.ok, latencyMs: result.latencyMs } });
    await prisma.rpcNode.update({
      where: { id: node.id },
      data: {
        healthStatus: result.ok ? 'up' : 'down',
        failCount: result.ok ? 0 : node.failCount + 1,
        lastLatencyMs: result.latencyMs
      }
    });
  }
}
