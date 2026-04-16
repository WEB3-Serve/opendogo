import cron from 'node-cron';

import { logger } from '../common/logger/index.js';

export function startCleanupJob() {
  cron.schedule('0 3 * * *', async () => {
    logger.info('running cleanup job');
  });
}
