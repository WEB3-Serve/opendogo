import { Router } from 'express';

import { requirePermission } from '../../common/middleware/permission.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { activateCard, listCardGroups, listCards } from './card.service.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await listCards())));
router.get('/groups', asyncHandler(async (_req, res) => res.json(await listCardGroups())));
router.post('/activate', requirePermission('cards:activate'), asyncHandler(async (req, res) => {
  const { userId, cardKey } = req.body;
  return res.json(await activateCard({ userId: Number(userId), cardKey }));
}));

export default router;
