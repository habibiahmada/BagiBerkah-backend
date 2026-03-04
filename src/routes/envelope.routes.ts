import { Router } from 'express';
import { EnvelopeController } from '../controllers/envelope.controller';
import { validate } from '../middlewares/validator';
import { createEnvelopeSchema } from '../validators/envelope.validator';

const router = Router();
const controller = new EnvelopeController();

// Create envelope
router.post('/', validate(createEnvelopeSchema), controller.create);

// Get envelope by ID
router.get('/:id', controller.getById);

// Get envelope status
router.get('/:id/status', controller.getStatus);

// Update envelope
router.patch('/:id', controller.update);

export default router;
