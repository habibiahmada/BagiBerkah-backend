import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate } from '../middlewares/validator';
import { createPaymentSchema } from '../validators/payment.validator';

const router = Router();
const controller = new PaymentController();

// Create payment
router.post('/create', validate(createPaymentSchema), controller.create);

// Get payment status
router.get('/:paymentId/status', controller.getStatus);

// Webhook from payment gateway
router.post('/webhook', controller.webhook);

export default router;
