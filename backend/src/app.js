import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import { logger } from './common/logger/index.js';
import routes from './routes/index.js';

const parseOrigins = () => {
  const raw = process.env.CORS_ORIGIN || '*';
  if (raw === '*') return '*';
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
};

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: parseOrigins(), credentials: true }));
  app.use(express.json());
  app.use(morgan('combined'));

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'opendogo-admin-backend',
      docs: 'Use /api/admin/* endpoints for admin APIs.',
    });
  });

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api/admin', routes);

  app.use((err, _req, res, _next) => {
    logger.error(err);
    res.status(500).json({ message: err.message || 'internal server error' });
  });

  return app;
}

const app = createApp();
export default app;
