import { Router } from 'express';
import { ClaimController } from '../controllers/claim.controller';
import { validate } from '../middlewares/validator';
import { submitClaimSchema, validateQRSchema } from '../validators/claim.validator';

const router = Router();
const controller = new ClaimController();

// Get claim by token
router.get('/:token', controller.getByToken);

// Submit claim
router.post('/:token', validate(submitClaimSchema), controller.submit);

// Validate QR code
router.post('/validate-qr', validate(validateQRSchema), controller.validateQR);

export default router;
