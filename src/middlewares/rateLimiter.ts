import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'ERR_1007',
      message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting
  skipSuccessfulRequests: false,
  // Skip failed requests from counting
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per 15 minutes
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'ERR_1007',
      message: 'Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI endpoint rate limiter
 * 20 requests per hour (AI is expensive)
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    error: {
      code: 'ERR_6000',
      message: 'Batas penggunaan AI tercapai. Silakan coba lagi dalam 1 jam.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment endpoint rate limiter
 * 5 requests per 15 minutes
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'ERR_4000',
      message: 'Terlalu banyak percobaan pembayaran. Silakan coba lagi nanti.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Claim endpoint rate limiter
 * 30 requests per 15 minutes
 */
export const claimRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: 'ERR_3000',
      message: 'Terlalu banyak percobaan klaim. Silakan coba lagi nanti.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * QR validation rate limiter
 * 10 requests per 5 minutes (prevent brute force)
 */
export const qrRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    success: false,
    error: {
      code: 'ERR_3004',
      message: 'Terlalu banyak percobaan validasi QR. Silakan coba lagi dalam 5 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Envelope creation rate limiter
 * 10 envelopes per hour
 */
export const envelopeCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      code: 'ERR_2000',
      message: 'Batas pembuatan amplop tercapai. Silakan coba lagi dalam 1 jam.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
