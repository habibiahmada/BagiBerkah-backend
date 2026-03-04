import helmet from 'helmet';

/**
 * Helmet configuration for API security
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Frameguard
  frameguard: { action: 'deny' },
  
  // Hide Powered By
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // XSS Filter
  xssFilter: true,
});

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'Idempotency-Key',
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

/**
 * Mayar webhook allowed IPs
 * Update with actual Mayar IPs in production
 */
export const MAYAR_WEBHOOK_IPS = [
  '127.0.0.1', // localhost for testing
  '::1', // localhost IPv6
  // Add actual Mayar IPs here when available
  // '103.xxx.xxx.xxx',
];

/**
 * Security configuration summary
 */
export const securityConfig = {
  // Request limits
  maxRequestSize: 1024 * 1024, // 1MB
  maxJsonSize: 1024 * 1024, // 1MB
  maxUrlEncodedSize: 1024 * 1024, // 1MB
  
  // Token settings
  tokenLength: 32, // 256 bits
  tokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Rate limiting
  rateLimits: {
    general: { windowMs: 15 * 60 * 1000, max: 100 },
    strict: { windowMs: 15 * 60 * 1000, max: 10 },
    ai: { windowMs: 60 * 60 * 1000, max: 20 },
    payment: { windowMs: 15 * 60 * 1000, max: 5 },
    claim: { windowMs: 15 * 60 * 1000, max: 30 },
    qr: { windowMs: 5 * 60 * 1000, max: 10 },
    envelope: { windowMs: 60 * 60 * 1000, max: 10 },
  },
  
  // Idempotency
  idempotencyCacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  
  // Webhook
  webhookIPs: MAYAR_WEBHOOK_IPS,
};
