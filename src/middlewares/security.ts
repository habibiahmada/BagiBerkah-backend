import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { AppError } from './errorHandler';
import logger from '../config/logger';

/**
 * MongoDB Query Sanitization
 * Prevents NoSQL injection attacks
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      key,
    });
  },
});

/**
 * Input Sanitization Middleware
 * Additional layer for XSS and injection prevention
 */

// Dangerous patterns to block
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc)
  /eval\(/gi, // eval function
  /expression\(/gi, // CSS expression
  /<iframe/gi, // iframes
  /<object/gi, // objects
  /<embed/gi, // embeds
  /vbscript:/gi, // VBScript
  /data:text\/html/gi, // Data URIs
];

// SQL Injection patterns
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\bOR\b.*=.*|'\s*OR\s*')/gi,
  /(\bUNION\b.*\bSELECT\b)/gi,
];

/**
 * Check for dangerous patterns
 */
function containsDangerousPattern(input: string): boolean {
  if (typeof input !== 'string') return false;
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for SQL injection attempts
 */
function containsSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  return SQL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  
  // Remove dangerous HTML/JS patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Encode special characters for HTML context
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize object recursively
 */
function sanitizeObject(obj: any, path: string = ''): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check for dangerous patterns
    if (containsDangerousPattern(obj)) {
      logger.warn('Dangerous pattern detected in input', { path, value: obj.substring(0, 50) });
      throw new AppError('Input mengandung karakter yang tidak diizinkan', 400, 'ERR_1005');
    }
    
    // Check for SQL injection
    if (containsSQLInjection(obj)) {
      logger.warn('SQL injection attempt detected', { path, value: obj.substring(0, 50) });
      throw new AppError('Input mencurigakan terdeteksi', 400, 'ERR_1005');
    }
    
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], path ? `${path}.${key}` : key);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body, 'body');
    }
    
    // Sanitize query params
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeObject(req.query, 'query');
    }
    
    // Sanitize URL params
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = sanitizeObject(req.params, 'params');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Request size limiter
 * Prevents memory exhaustion attacks
 */
export const requestSizeLimiter = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > maxSize) {
      logger.warn('Request too large', {
        ip: req.ip,
        path: req.path,
        size: contentLength,
        maxSize,
      });
      
      return res.status(413).json({
        success: false,
        error: {
          code: 'ERR_1006',
          message: `Request terlalu besar. Maksimal: ${Math.round(maxSize / 1024)} KB`,
        },
      });
    }
    
    next();
  };
};

/**
 * HTTPS enforcement middleware
 */
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    logger.info('Redirecting HTTP to HTTPS', { path: req.path });
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

/**
 * Request ID middleware for tracking
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.get('x-request-id') || generateRequestId();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * IP Whitelist middleware for webhooks
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // In development, allow all
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Check if IP is whitelisted
    const isAllowed = allowedIPs.some(ip => {
      if (ip.includes('/')) {
        // CIDR notation support (basic)
        const baseIP = ip.split('/')[0];
        return clientIP.startsWith(baseIP.substring(0, baseIP.lastIndexOf('.')));
      }
      return clientIP === ip || clientIP.includes(ip);
    });
    
    if (!isAllowed) {
      logger.warn('Unauthorized IP attempt', {
        ip: clientIP,
        path: req.path,
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'ERR_1004',
          message: 'Akses ditolak',
        },
      });
    }
    
    next();
  };
};

/**
 * Idempotency middleware
 * Prevents duplicate processing of requests
 */
const idempotencyCache = new Map<string, { status: number; data: any; timestamp: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > oneDay) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export const idempotency = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.get('idempotency-key');
  
  if (!idempotencyKey) {
    return next();
  }
  
  // Validate idempotency key format
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(idempotencyKey)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ERR_1005',
        message: 'Idempotency key tidak valid',
      },
    });
  }
  
  // Check if request was already processed
  if (idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey)!;
    logger.info('Idempotent request detected', {
      key: idempotencyKey,
      path: req.path,
    });
    return res.status(cached.status).json(cached.data);
  }
  
  // Store original send function
  const originalJson = res.json.bind(res);
  
  // Override json to cache response
  res.json = function(data: any) {
    idempotencyCache.set(idempotencyKey, {
      status: res.statusCode,
      data,
      timestamp: Date.now(),
    });
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Security headers middleware
 * Additional security headers beyond helmet
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};
