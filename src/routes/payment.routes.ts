import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate } from '../middlewares/validator';
import { createPaymentSchema } from '../validators/payment.validator';
import { paymentRateLimiter, strictRateLimiter } from '../middlewares/rateLimiter';
import { ipWhitelist, idempotency } from '../middlewares/security';
import { MAYAR_WEBHOOK_IPS } from '../config/security';

const router: ExpressRouter = Router();
const controller = new PaymentController();

// Create payment (with idempotency and strict rate limit)
router.post('/create', paymentRateLimiter, idempotency, validate(createPaymentSchema), controller.create);

// Get payment status
router.get('/:paymentId/status', controller.getStatus);

// Webhook from payment gateway (IP whitelist + strict rate limit)
router.post('/webhook', ipWhitelist(MAYAR_WEBHOOK_IPS), strictRateLimiter, controller.webhook);

// Mock payment simulation (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/mock-success/:envelopeId', controller.mockPaymentSuccess);
}

export default router;
