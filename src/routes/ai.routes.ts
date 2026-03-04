import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { validate } from '../middlewares/validator';
import { allocationRequestSchema, greetingRequestSchema } from '../validators/ai.validator';

const router = Router();
const controller = new AIController();

// Get AI allocation recommendation
router.post('/allocate', validate(allocationRequestSchema), controller.allocate);

// Generate personal greeting
router.post('/greeting', validate(greetingRequestSchema), controller.generateGreeting);

export default router;
