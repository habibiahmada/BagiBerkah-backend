import { z } from 'zod';

export const createPaymentSchema = z.object({
  envelopeId: z.string().min(1, 'Envelope ID wajib diisi'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
