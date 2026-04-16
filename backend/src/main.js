import 'dotenv/config';

import prisma from './config/db.js';
import { logger } from './common/logger/index.js';
import { startCleanupJob } from './jobs/cleanup.job.js';
import { startRpcHealthJob } from './jobs/rpcHealth.job.js';
import app from './app.js';

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
  startRpcHealthJob();
  startCleanupJob();
  app.listen(port, () => logger.info(`admin backend listening on :${port}`));
}

bootstrap().catch(async (err) => {
  logger.error('bootstrap failed', err);
  await prisma.$disconnect();
  process.exit(1);
});
