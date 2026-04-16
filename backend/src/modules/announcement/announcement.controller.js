import { Router } from 'express';

import { requirePermission } from '../../common/middleware/permission.js';
import prisma from '../../config/db.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await prisma.announcement.findMany({ orderBy: { id: 'desc' } }));
}));

router.post('/', requirePermission('announcements:write'), asyncHandler(async (req, res) => {
  res.json(await prisma.announcement.create({ data: req.body }));
}));

export default router;
