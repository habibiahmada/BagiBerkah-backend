import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { EnvelopeController } from '../controllers/envelope.controller';
import { validate } from '../middlewares/validator';
import { createEnvelopeSchema, checkEnvelopeSchema } from '../validators/envelope.validator';
import { envelopeCreationRateLimiter } from '../middlewares/rateLimiter';
import { idempotency } from '../middlewares/security';

const router: ExpressRouter = Router();
const controller = new EnvelopeController();

// Check envelope by access code - MUST BE BEFORE /:id
router.post('/check', validate(checkEnvelopeSchema), controller.checkByAccessCode);

// Create envelope (with idempotency and strict rate limit)
router.post('/', envelopeCreationRateLimiter, idempotency, validate(createEnvelopeSchema), controller.create);

// Validate allocation before creating
router.post('/validate-allocation', controller.validateAllocation);

// Get envelope by ID
router.get('/:id', controller.getById);

// Get envelope status
router.get('/:id/status', controller.getStatus);

// Update envelope
router.patch('/:id', controller.update);

export default router;
