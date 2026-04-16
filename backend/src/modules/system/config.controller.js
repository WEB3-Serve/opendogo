import { Router } from 'express';

import { requirePermission } from '../../common/middleware/permission.js';
import prisma from '../../config/db.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

router.get('/:scope', asyncHandler(async (req, res) => {
  const { scope } = req.params;
  const items = await prisma.systemConfig.findMany({ where: { scope } });
  res.json(items);
}));

router.put('/:scope', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const { scope } = req.params;
  const { key, value } = req.body;
  const data = await prisma.systemConfig.upsert({
    where: { scope_key: { scope, key } },
    update: { value },
    create: { scope, key, value }
  });
  res.json(data);
}));

export default router;
