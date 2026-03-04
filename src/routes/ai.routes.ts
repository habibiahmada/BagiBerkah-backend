import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AIController } from '../controllers/ai.controller';
import { validate } from '../middlewares/validator';
import { allocationRequestSchema, greetingRequestSchema } from '../validators/ai.validator';
import { aiRateLimiter } from '../middlewares/rateLimiter';

const router: ExpressRouter = Router();
const controller = new AIController();

// Apply AI-specific rate limiter to all AI routes
router.use(aiRateLimiter);

// Get AI allocation recommendation
router.post('/allocate', validate(allocationRequestSchema), controller.allocate);

// Generate personal greeting
router.post('/greeting', validate(greetingRequestSchema), controller.generateGreeting);

export default router;
