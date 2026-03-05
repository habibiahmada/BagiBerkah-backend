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
      const response = await axios.post(
        `${this.mayarBaseUrl}/v1/payments`,
        {
          amount: data.amount,
          description: `Dukungan untuk BagiBerkah${data.donorName ? ` dari ${data.donorName}` : ''}`,
          reference_id: `donation_${Date.now()}`,
          callback_url: `${process.env.APP_URL}/api/donations/webhook`,
          return_url: `${process.env.FRONTEND_URL}/support/success`,
          cancel_url: `${process.env.FRONTEND_URL}/support`,
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
          paymentId: response.data.id || response.data.payment_id,
          amount: data.amount,
          donorName: data.donorName || 'Anonymous',
          message: data.message,
          status: 'PENDING',
          paymentUrl: response.data.payment_url || response.data.checkout_url,
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
      take: 5,
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
}
