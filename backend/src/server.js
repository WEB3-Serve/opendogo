import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { domainGuard } from './middleware/domainGuard.js';
import { requireAdminAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { ensureAdminUser } from './services/bootstrapService.js';
import { prisma } from './db/prisma.js';
import { getRedis } from './db/redis.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(domainGuard);

app.get('/health', async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`;
  const redis = getRedis();
  const redisOk = redis ? await redis.ping() : 'DISABLED';
  res.json({ ok: true, db: dbOk ? 'UP' : 'DOWN', redis: redisOk, env: config.nodeEnv });
});

app.use('/api/admin/auth', authRouter);
app.use('/api/admin', adminRouter);

app.get('/api/admin/profile', requireAdminAuth, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

app.get('/admin/login', (_req, res) => {
  res.json({
    ok: true,
    message: 'Use /api/admin/auth/login-password then /api/admin/auth/login-2fa'
  });
});

const start = async () => {
  await ensureAdminUser();
  app.listen(config.port, () => {
    console.log(`backend listening on http://localhost:${config.port}`);
  });
};

start().catch((err) => {
  console.error('failed to start backend:', err);
  process.exit(1);
});
