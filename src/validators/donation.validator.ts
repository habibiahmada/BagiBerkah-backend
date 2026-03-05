import { z } from 'zod';

export const createDonationSchema = z.object({
  amount: z.number()
    .min(10000, 'Minimum donation is Rp 10,000')
    .max(10000000, 'Maximum donation is Rp 10,000,000')
    .refine((val) => Number.isInteger(val), {
      message: 'Amount must be integer (no decimals)'
    }),
  donorName: z.string().max(100).optional(),
  donorEmail: z.string().email('Email tidak valid').optional(),
  donorPhone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit').optional(),
  message: z.string().max(500).optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
