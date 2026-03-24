import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { domainGuard } from './middleware/domainGuard.js';
import { requireAdminAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { clientRouter } from './routes/client.js';
import { ensureAdminUser } from './services/bootstrapService.js';
import { prisma } from './db/prisma.js';
import { getRedis } from './db/redis.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      if (config.allowedOrigins.includes(hostname)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS_NOT_ALLOWED: ${hostname}`));
    } catch {
      return callback(new Error('CORS_INVALID_ORIGIN'));
    }
  }
}));
app.use(express.json());
app.use(domainGuard);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

app.get('/health', async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`;
  const redis = getRedis();
  const redisOk = redis ? await redis.ping() : 'DISABLED';
  res.json({ ok: true, db: dbOk ? 'UP' : 'DOWN', redis: redisOk, env: config.nodeEnv });
});

app.use('/api/admin/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/client', clientRouter);

app.get('/api/admin/profile', requireAdminAuth, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

app.get('/admin/login', (_req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.get('/admin', (_req, res) => {
  res.redirect('/admin/login');
});

app.get('/admin.css', (_req, res) => {
  res.sendFile(path.join(rootDir, 'admin.css'));
});

app.get('/admin.js', (_req, res) => {
  res.sendFile(path.join(rootDir, 'admin.js'));
});

app.use((err, _req, res, _next) => {
  if (err?.message?.startsWith('CORS_')) {
    return res.status(403).json({ ok: false, error: err.message });
  }
  return res.status(500).json({ ok: false, error: 'INTERNAL_SERVER_ERROR' });
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
