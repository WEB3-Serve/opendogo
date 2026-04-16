import { Router } from 'express';

import { requirePermission } from '../../common/middleware/permission.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { addRpcNode, listRpcNodes, selectRpcNode } from './rpc.service.js';
import { runRpcHealthCheck } from './rpc.scheduler.js';

const router = Router();

router.get('/nodes', asyncHandler(async (_req, res) => res.json(await listRpcNodes())));
router.post('/nodes', requirePermission('rpc:manage'), asyncHandler(async (req, res) => res.json(await addRpcNode(req.body))));
router.get('/pick', asyncHandler(async (_req, res) => res.json(await selectRpcNode())));
router.post('/health-check', requirePermission('rpc:manage'), asyncHandler(async (_req, res) => {
  await runRpcHealthCheck();
  res.json({ ok: true });
}));

export default router;
