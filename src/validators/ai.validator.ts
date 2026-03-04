import { z } from 'zod';

export const allocationRequestSchema = z.object({
  totalBudget: z.number().min(10000),
  recipients: z.array(
    z.object({
      name: z.string(),
      ageLevel: z.enum(['CHILD', 'TEEN', 'ADULT']),
      status: z.enum(['SCHOOL', 'COLLEGE', 'WORKING', 'NOT_WORKING']),
      closeness: z.enum(['VERY_CLOSE', 'CLOSE', 'DISTANT']),
    })
  ).min(1),
});

export const greetingRequestSchema = z.object({
  recipientName: z.string(),
  ageLevel: z.enum(['CHILD', 'TEEN', 'ADULT']),
  context: z.string().optional(),
  amount: z.number(),
});

export type AllocationRequest = z.infer<typeof allocationRequestSchema>;
export type GreetingRequest = z.infer<typeof greetingRequestSchema>;
