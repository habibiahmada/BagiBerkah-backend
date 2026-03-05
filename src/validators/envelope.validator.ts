import { z } from 'zod';

export const createEnvelopeSchema = z.object({
  envelopeName: z.string().min(1, 'Nama amplop wajib diisi').max(100, 'Nama amplop maksimal 100 karakter'),
  totalBudget: z.number()
    .min(10000, 'Total budget minimal Rp 10.000')
    .max(1000000000, 'Total budget maksimal Rp 1 Miliar')
    .refine((val) => Number.isInteger(val), {
      message: 'Total budget harus bilangan bulat (tanpa desimal)'
    }),
  distributionMode: z.enum(['DIGITAL', 'CASH']),
  recipients: z.array(
    z.object({
      name: z.string().min(1, 'Nama penerima wajib diisi'),
      ageLevel: z.enum(['CHILD', 'TEEN', 'ADULT']),
      status: z.enum(['SCHOOL', 'COLLEGE', 'WORKING', 'NOT_WORKING']),
      closeness: z.enum(['VERY_CLOSE', 'CLOSE', 'DISTANT']),
      contact: z.string().optional(),
      greetingContext: z.string().optional(),
      allocatedAmount: z.number()
        .min(0, 'Alokasi tidak boleh negatif')
        .refine((val) => Number.isInteger(val), {
          message: 'Alokasi harus bilangan bulat (tanpa desimal)'
        }),
      aiReasoning: z.string().optional(),
      aiGreeting: z.string().optional(),
    })
  ).min(1, 'Minimal 1 penerima'),
});

export const checkEnvelopeSchema = z.object({
  accessCode: z.string().min(1, 'Kode akses wajib diisi'),
});

export type CreateEnvelopeInput = z.infer<typeof createEnvelopeSchema>;
export type CheckEnvelopeInput = z.infer<typeof checkEnvelopeSchema>;
