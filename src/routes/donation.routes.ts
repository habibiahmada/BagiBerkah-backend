import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { DonationController } from '../controllers/donation.controller';
import { validate } from '../middlewares/validator';
import { z } from 'zod';

const router: ExpressRouter = Router();
const donationController = new DonationController();

// Validation schemas
const createDonationSchema = z.object({
  amount: z.number().min(10000).max(10000000),
  donorName: z.string().optional(),
  message: z.string().max(500).optional(),
});

// Routes
router.post(
  '/create',
  validate(createDonationSchema),
  donationController.createDonation
);

router.get('/stats', donationController.getStats);

router.post('/webhook', donationController.handleWebhook);

export default router;
