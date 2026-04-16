import { Router } from 'express';

import { auth } from '../common/middleware/auth.js';
import { requirePermission } from '../common/middleware/permission.js';
import announcementRouter from '../modules/announcement/announcement.controller.js';
import authRouter from '../modules/auth/auth.controller.js';
import cardRouter from '../modules/card/card.controller.js';
import queryRouter from '../modules/query/query.controller.js';
import rpcRouter from '../modules/rpc/rpc.controller.js';
import systemRouter from '../modules/system/config.controller.js';
import userRouter from '../modules/user/user.controller.js';

const router = Router();

router.use('/auth', authRouter);
router.use(auth(['super_admin', 'admin', 'operator']));

router.use('/dashboard', requirePermission('dashboard:read'), queryRouter);
router.use('/users', requirePermission('users:read'), userRouter);
router.use('/cards', requirePermission('cards:read'), cardRouter);
router.use('/rpc', requirePermission('rpc:read'), rpcRouter);
router.use('/settings', requirePermission('settings:read'), systemRouter);
router.use('/announcements', requirePermission('announcements:read'), announcementRouter);

export default router;
