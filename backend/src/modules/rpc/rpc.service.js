import prisma from '../../config/db.js';
import { pickNode } from './rpc.pool.js';

export async function listRpcNodes() {
  return prisma.rpcNode.findMany({ orderBy: [{ priority: 'asc' }, { weight: 'desc' }] });
}

export async function addRpcNode(payload) {
  return prisma.rpcNode.create({ data: payload });
}

export async function selectRpcNode() {
  const nodes = await listRpcNodes();
  return pickNode(nodes);
}
