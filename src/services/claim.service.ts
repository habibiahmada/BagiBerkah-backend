import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { SubmitClaimInput } from '../validators/claim.validator';
import { DisbursementService } from './disbursement.service';
import crypto from 'crypto';

export class ClaimService {
  private disbursementService: DisbursementService;

  constructor() {
    this.disbursementService = new DisbursementService();
  }
  /**
   * Create claim for recipient
   */
  async createClaim(recipientId: string) {
    const token = this.generateSecureToken();
    const qrToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const claim = await prisma.claim.create({
      data: {
        recipientId,
        token,
        qrToken,
        expiresAt,
        status: 'PENDING',
      },
    });

    return claim;
  }

  /**
   * Get claim by token
   */
  async getByToken(token: string) {
    const claim = await prisma.claim.findUnique({
      where: { token },
      include: {
        recipient: {
          include: {
            envelope: true,
          },
        },
      },
    });

    if (!claim) {
      return null;
    }

    // Check if expired
    if (new Date() > claim.expiresAt) {
      await prisma.claim.update({
        where: { id: claim.id },
        data: { status: 'EXPIRED' },
      });
      throw new AppError('Claim has expired', 410);
    }

    // Update status to OPENED if first time
    if (claim.status === 'PENDING') {
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status: 'OPENED',
          openedAt: new Date(),
        },
      });
    }

    return {
      token: claim.token,
      recipientName: claim.recipient.name,
      amount: claim.recipient.allocatedAmount,
      greeting: claim.recipient.aiGreeting || 'Selamat Idul Fitri! Mohon maaf lahir batin.',
      status: claim.status,
      qrToken: claim.qrToken,
      expiresAt: claim.expiresAt,
      distributionMode: claim.recipient.envelope.distributionMode,
    };
  }

  /**
   * Submit claim
   */
  async submit(token: string, data: SubmitClaimInput) {
    const claim = await prisma.claim.findUnique({
      where: { token },
      include: {
        recipient: {
          include: {
            envelope: true,
          },
        },
      },
    });

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    // Check if already claimed
    if (claim.status === 'CLAIMED' || claim.status === 'VALIDATED') {
      throw new AppError('Claim already processed', 400);
    }

    // Check if expired
    if (new Date() > claim.expiresAt) {
      throw new AppError('Claim has expired', 410);
    }

    // Update claim
    const updatedClaim = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: 'CLAIMED',
        claimMethod: data.claimMethod,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        claimedAt: new Date(),
      },
      include: {
        recipient: true,
      },
    });

    // For digital mode, initiate transfer
    if (data.claimMethod === 'digital' && data.bankAccount && data.bankName) {
      try {
        const disbursement = await this.disbursementService.processTransfer(
          updatedClaim.id,
          data.bankAccount,
          data.bankName,
          updatedClaim.recipient.allocatedAmount
        );

        console.log('✅ Digital transfer initiated:', disbursement);
      } catch (error: any) {
        console.error('❌ Disbursement error:', error.message);
        // Don't fail the claim if disbursement fails
        // Admin can retry manually
      }
    }

    return {
      claimId: updatedClaim.id,
      status: updatedClaim.status,
      qrToken: updatedClaim.qrToken,
      claimMethod: updatedClaim.claimMethod,
      message:
        data.claimMethod === 'digital'
          ? 'Transfer sedang diproses'
          : 'Tunjukkan QR code saat bertemu untuk validasi',
    };
  }

  /**
   * Validate QR code
   */
  async validateQR(qrToken: string) {
    const claim = await prisma.claim.findUnique({
      where: { qrToken },
      include: {
        recipient: true,
      },
    });

    if (!claim) {
      throw new AppError('Invalid QR code', 404);
    }

    // Check if already validated
    if (claim.status === 'VALIDATED') {
      throw new AppError('QR code already used', 400);
    }

    // Check if claimed
    if (claim.status !== 'CLAIMED') {
      throw new AppError('Claim must be submitted first', 400);
    }

    // Validate
    const validated = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
      include: {
        recipient: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'QR_VALIDATED',
        entityType: 'CLAIM',
        entityId: claim.id,
        details: {
          recipientName: validated.recipient.name,
          amount: validated.recipient.allocatedAmount,
        },
      },
    });

    return {
      valid: true,
      recipientName: validated.recipient.name,
      amount: validated.recipient.allocatedAmount,
      claimId: validated.id,
      message: 'QR code validated successfully. You can now give the cash.',
    };
  }

  /**
   * Generate cryptographically secure token
   * 256 bits (32 bytes) for maximum security
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
