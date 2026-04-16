import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import prisma from './config/db.js';
import { logger } from './common/logger/index.js';
import { startCleanupJob } from './jobs/cleanup.job.js';
import { startRpcHealthJob } from './jobs/rpcHealth.job.js';
import routes from './routes/index.js';

const app = express();
const port = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('backend/src/public'));

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', routes);

app.use((err, _req, res, _next) => {
  logger.error(err);
  res.status(500).json({ message: err.message || 'internal server error' });
});

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
