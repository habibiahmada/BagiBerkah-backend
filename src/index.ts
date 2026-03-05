import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import {
  sanitizeMongo,
  sanitizeInput,
  requestSizeLimiter,
  enforceHTTPS,
  requestId,
  securityHeaders,
} from './middlewares/security';
import routes from './routes';
import logger from './config/logger';
import { env } from './config/env';
import { helmetConfig, corsConfig } from './config/security';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const PORT = env.PORT || 5000;

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security Middlewares (Order matters!)
app.use(helmetConfig); // Helmet security headers
app.use(securityHeaders); // Additional security headers
app.use(enforceHTTPS); // HTTPS enforcement (production only)
app.use(requestId); // Request ID tracking
app.use(cors(corsConfig)); // CORS with strict configuration

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request size limiter
app.use(requestSizeLimiter(1024 * 1024)); // 1MB max

// Input sanitization
app.use(sanitizeMongo); // MongoDB injection prevention
app.use(sanitizeInput); // XSS and SQL injection prevention

// Rate limiting
app.use(rateLimiter); // General rate limiting

// Request logging
app.use(requestLogger);

// Health check (accessible from both root and /api)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api', routes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ERR_1002',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  logger.info(`🔗 API URL: ${env.APP_URL}`);
  logger.info(`🔒 Security: Enhanced mode enabled`);
});

export default app;
