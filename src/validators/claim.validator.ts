import { z } from 'zod';

export const submitClaimSchema = z.object({
  claimMethod: z.enum(['digital', 'cash']),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
});

export const validateQRSchema = z.object({
  qrToken: z.string().min(1, 'QR token wajib diisi'),
});

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>;
export type ValidateQRInput = z.infer<typeof validateQRSchema>;
