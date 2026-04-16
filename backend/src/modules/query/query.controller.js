import { Router } from 'express';

import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { dashboardSummary } from './query.service.js';

const router = Router();
router.get('/summary', asyncHandler(async (_req, res) => res.json(await dashboardSummary())));
export default router;
