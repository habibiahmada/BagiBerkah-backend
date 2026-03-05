import { z } from 'zod';

export const createDonationSchema = z.object({
  amount: z.number().min(10000, 'Minimum donation is Rp 10,000').max(10000000, 'Maximum donation is Rp 10,000,000'),
  donorName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
