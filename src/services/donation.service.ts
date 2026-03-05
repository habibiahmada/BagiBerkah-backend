import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class DonationService {
  private mayarApiKey: string;
  private mayarBaseUrl: string;

  constructor() {
    this.mayarApiKey = process.env.MAYAR_API_KEY || '';
    this.mayarBaseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.id';
  }

  /**
   * Create donation payment link using Mayar
   */
  async createDonation(data: {
    amount: number;
    donorName?: string;
    message?: string;
  }) {
    // Mock mode for development
    if (!this.mayarApiKey || this.mayarApiKey === 'your-mayar-api-key') {
      console.warn('⚠️  MAYAR_API_KEY not configured, using mock donation mode');
      return this.createMockDonation(data);
    }

    try {
      // Create Mayar payment link for donation
      // Mayar API: https://docs.mayar.id/api-reference/payment/create
      const response = await axios.post(
        `${this.mayarBaseUrl}/payment/create`,
        {
          amount: data.amount,
          description: `Dukungan untuk BagiBerkah${data.donorName ? ` dari ${data.donorName}` : ''}`,
          externalId: `donation_${Date.now()}`,
          callbackUrl: `${process.env.APP_URL}/api/donations/webhook`,
          redirectUrl: `${process.env.FRONTEND_URL}/support/success`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.mayarApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Save donation record
      const donation = await prisma.donation.create({
        data: {
          paymentId: response.data.data?.id || response.data.id || `mayar_${Date.now()}`,
          amount: data.amount,
          donorName: data.donorName || 'Anonymous',
          message: data.message,
          status: 'PENDING',
          paymentUrl: response.data.data?.url || response.data.url || response.data.paymentUrl,
        },
      });

      return {
        donationId: donation.id,
        paymentUrl: donation.paymentUrl,
        amount: donation.amount,
      };
    } catch (error: any) {
      console.error('Mayar Donation Error:', error.response?.data || error.message);
      
      // Fallback to mock
      console.warn('⚠️  Falling back to mock donation mode');
      return this.createMockDonation(data);
    }
  }

  /**
   * Create mock donation for development
   */
  private async createMockDonation(data: {
    amount: number;
    donorName?: string;
    message?: string;
  }) {
    const mockPaymentId = `mock_donation_${Date.now()}`;
    
    const donation = await prisma.donation.create({
      data: {
        paymentId: mockPaymentId,
        amount: data.amount,
        donorName: data.donorName || 'Anonymous',
        message: data.message,
        status: 'PENDING',
        paymentUrl: `${process.env.FRONTEND_URL}/support/mock-success`,
      },
    });

    return {
      donationId: donation.id,
      paymentUrl: donation.paymentUrl,
      amount: donation.amount,
    };
  }

  /**
   * Get donation statistics
   */
  async getStats() {
    const totalDonations = await prisma.donation.count({
      where: { status: 'SUCCESS' },
    });

    const totalAmount = await prisma.donation.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const recentDonations = await prisma.donation.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        donorName: true,
        amount: true,
        message: true,
        createdAt: true,
      },
    });

    return {
      totalDonations,
      totalAmount: totalAmount._sum.amount || 0,
      recentDonations,
    };
  }

  /**
   * Update donation status (called by webhook)
   */
  async updateDonationStatus(paymentId: string, status: 'SUCCESS' | 'FAILED') {
    const donation = await prisma.donation.findUnique({
      where: { paymentId },
    });

    if (!donation) {
      throw new AppError('Donation not found', 404);
    }

    await prisma.donation.update({
      where: { paymentId },
      data: {
        status,
        paidAt: status === 'SUCCESS' ? new Date() : null,
      },
    });

    console.log(`✅ Donation ${paymentId} status updated to ${status}`);
  }

  /**
   * Update donation status by externalId (for Mayar webhook)
   */
  async updateDonationStatusByExternalId(externalId: string, status: 'SUCCESS' | 'FAILED') {
    // externalId format: "donation_1234567890"
    // We need to find donation by paymentId that contains this externalId
    
    const donation = await prisma.donation.findFirst({
      where: {
        paymentId: {
          contains: externalId,
        },
      },
    });

    if (!donation) {
      console.error(`❌ Donation not found for externalId: ${externalId}`);
      throw new AppError('Donation not found', 404);
    }

    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status,
        paidAt: status === 'SUCCESS' ? new Date() : null,
      },
    });

    console.log(`✅ Donation ${donation.id} (${externalId}) status updated to ${status}`);
  }
}
