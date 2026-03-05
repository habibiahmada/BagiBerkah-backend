import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { ClaimController } from '../controllers/claim.controller';
import { validate } from '../middlewares/validator';
import { submitClaimSchema, validateQRSchema } from '../validators/claim.validator';
import { claimRateLimiter, qrRateLimiter } from '../middlewares/rateLimiter';

const router: ExpressRouter = Router();
const controller = new ClaimController();

// Apply claim-specific rate limiter
router.use(claimRateLimiter);

// Validate QR code (stricter rate limit) - MUST BE BEFORE /:token
router.post('/validate-qr', qrRateLimiter, validate(validateQRSchema), controller.validateQR);

// Get claim by token
router.get('/:token', controller.getByToken);

// Submit claim
router.post('/:token', validate(submitClaimSchema), controller.submit);

// Complete game/quiz
router.post('/:token/complete-game', controller.completeGame);

export default router;
