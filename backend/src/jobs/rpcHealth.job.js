import cron from 'node-cron';

import { logger } from '../common/logger/index.js';
import { runRpcHealthCheck } from '../modules/rpc/rpc.scheduler.js';

export function startRpcHealthJob() {
  cron.schedule('*/2 * * * *', async () => {
    logger.info('running rpc health job');
    await runRpcHealthCheck();
  });
}
