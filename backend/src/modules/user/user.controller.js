import { Router } from 'express';

import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { getUserById, listActivations, listGroups, listUsers } from './user.service.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await listUsers())));
router.get('/groups', asyncHandler(async (_req, res) => res.json(await listGroups())));
router.get('/activations', asyncHandler(async (_req, res) => res.json(await listActivations())));
router.get('/:id', asyncHandler(async (req, res) => res.json(await getUserById(Number(req.params.id)))));

export default router;
