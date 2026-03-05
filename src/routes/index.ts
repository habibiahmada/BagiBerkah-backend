import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import envelopeRoutes from './envelope.routes';
import aiRoutes from './ai.routes';
import claimRoutes from './claim.routes';
import paymentRoutes from './payment.routes';
import donationRoutes from './donation.routes';

const router: ExpressRouter = Router();

// API Routes
router.use('/envelopes', envelopeRoutes);
router.use('/ai', aiRoutes);
router.use('/claims', claimRoutes);
router.use('/payments', paymentRoutes);
router.use('/donations', donationRoutes);

// API Info
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'BagiBerkah API',
    version: '1.0.0',
    description: 'AI-Powered THR Experience API',
    endpoints: {
      envelopes: '/api/envelopes',
      ai: '/api/ai',
      claims: '/api/claims',
      payments: '/api/payments',
      donations: '/api/donations',
    },
  });
});

export default router;
