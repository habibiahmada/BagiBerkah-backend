import prisma from '../config/database';
import { CreateEnvelopeInput } from '../validators/envelope.validator';
import { AppError } from '../middlewares/errorHandler';
import { ClaimService } from './claim.service';

export class EnvelopeService {
  private claimService: ClaimService;

  constructor() {
    this.claimService = new ClaimService();
  }

  async create(data: CreateEnvelopeInput) {
    // Validate total budget matches allocated amounts
    const totalAllocated = data.recipients.reduce(
      (sum, r) => sum + r.allocatedAmount,
      0
    );

    if (totalAllocated !== data.totalBudget) {
      const difference = data.totalBudget - totalAllocated;
      throw new AppError(
        `Total alokasi (Rp ${totalAllocated.toLocaleString('id-ID')}) harus sama dengan total budget (Rp ${data.totalBudget.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs(difference).toLocaleString('id-ID')} ${difference > 0 ? 'kurang' : 'lebih'}`,
        400,
        'ERR_2003'
      );
    }

    // Create envelope with recipients
    const envelope = await prisma.envelope.create({
      data: {
        totalBudget: data.totalBudget,
        distributionMode: data.distributionMode,
        status: data.distributionMode === 'DIGITAL' ? 'PENDING_PAYMENT' : 'ACTIVE',
        recipients: {
          create: data.recipients.map((recipient) => ({
            name: recipient.name,
            ageLevel: recipient.ageLevel,
            status: recipient.status,
            closeness: recipient.closeness,
            contact: recipient.contact,
            greetingContext: recipient.greetingContext,
            allocatedAmount: recipient.allocatedAmount,
            aiReasoning: recipient.aiReasoning,
            aiGreeting: recipient.aiGreeting,
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    // Create claims for each recipient
    for (const recipient of envelope.recipients) {
      await this.claimService.createClaim(recipient.id);
    }

    return envelope;
  }

  async getById(id: string) {
    const envelope = await prisma.envelope.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            claim: true,
          },
        },
        payment: true,
      },
    });

    return envelope;
  }

  async getStatus(id: string) {
    const envelope = await prisma.envelope.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            claim: {
              select: {
                status: true,
                claimedAt: true,
                validatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!envelope) {
      return null;
    }

    const totalRecipients = envelope.recipients.length;
    const claimedCount = envelope.recipients.filter(
      (r) => r.claim?.status === 'CLAIMED' || r.claim?.status === 'VALIDATED'
    ).length;

    return {
      envelopeId: envelope.id,
      status: envelope.status,
      totalRecipients,
      claimedCount,
      pendingCount: totalRecipients - claimedCount,
      recipients: envelope.recipients.map((r) => ({
        id: r.id,
        name: r.name,
        amount: r.allocatedAmount,
        claimStatus: r.claim?.status || 'PENDING',
        claimedAt: r.claim?.claimedAt,
      })),
    };
  }

  async update(id: string, data: Partial<CreateEnvelopeInput>) {
    const envelope = await prisma.envelope.update({
      where: { id },
      data: {
        ...(data.totalBudget && { totalBudget: data.totalBudget }),
        ...(data.distributionMode && { distributionMode: data.distributionMode }),
      },
      include: {
        recipients: true,
      },
    });

    return envelope;
  }

  async activateEnvelope(id: string) {
    return await prisma.envelope.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}
