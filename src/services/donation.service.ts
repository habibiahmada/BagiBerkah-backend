import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class DonationService {
  private mayarApiKey: string;
  private mayarBaseUrl: string;

  constructor() {
    this.mayarApiKey = process.env.MAYAR_API_KEY || '';
    this.mayarBaseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.id/hl/v1';
    
    // Log configuration on startup
    console.log('🔧 Mayar Service initialized:', {
      hasApiKey: !!this.mayarApiKey,
      apiKeyLength: this.mayarApiKey?.length || 0,
      baseUrl: this.mayarBaseUrl,
    });
  }

  /**
   * Create donation payment link using Mayar
   */
  async createDonation(data: {
    amount: number;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
    message?: string;
  }) {
    // Mock mode for development
    if (!this.mayarApiKey || this.mayarApiKey === 'your-mayar-api-key') {
      console.warn('⚠️  MAYAR_API_KEY not configured, using mock donation mode');
      return this.createMockDonation(data);
    }

    try {
      // Create Mayar payment link for donation
      // Mayar API: https://docs.mayar.club
      const productId = `donation_${Date.now()}`;
      
      // Validate API key
      if (!this.mayarApiKey || this.mayarApiKey.length < 50) {
        throw new Error('Invalid or missing MAYAR_API_KEY');
      }

      console.log('🔄 Creating Mayar donation payment:', {
        amount: data.amount,
        productId,
        baseUrl: this.mayarBaseUrl,
        apiKeyLength: this.mayarApiKey.length,
        apiKeyPrefix: this.mayarApiKey.substring(0, 30) + '...',
      });

      // Mayar API format - using invoice/create endpoint
      const requestBody = {
        name: data.donorName || 'Anonymous',
        email: data.donorEmail || 'anonymous@bagiberkah.com',
        mobile: data.donorPhone || '081234567890',
        redirectURL: `${process.env.FRONTEND_URL}/support/success`,
        description: `Dukungan untuk BagiBerkah${data.donorName ? ` dari ${data.donorName}` : ''}`,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        items: [
          {
            name: 'Donasi BagiBerkah',
            quantity: 1,
            rate: data.amount,
          }
        ],
      };

      console.log('📤 Mayar request:', {
        url: `${this.mayarBaseUrl}/invoice/create`,
        body: requestBody,
      });

      const response = await axios.post(
        `${this.mayarBaseUrl}/invoice/create`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.mayarApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ Mayar response:', {
        status: response.status,
        data: response.data,
      });

      // Extract payment URL and ID from Mayar invoice response
      const paymentUrl = response.data.url || response.data.data?.url || response.data.invoiceUrl;
      const paymentId = response.data.id || response.data.data?.id || response.data.invoiceId || productId;

      if (!paymentUrl) {
        throw new Error('Payment URL not found in Mayar response');
      }

      // Save donation record
      const donation = await prisma.donation.create({
        data: {
          paymentId: paymentId,
          amount: data.amount,
          donorName: data.donorName || 'Anonymous',
          message: data.message,
          status: 'PENDING',
          paymentUrl: paymentUrl,
        },
      });

      console.log('✅ Donation created:', donation.id);

      return {
        donationId: donation.id,
        paymentUrl: donation.paymentUrl,
        amount: donation.amount,
      };
    } catch (error: any) {
      // Detailed error logging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        baseUrl: this.mayarBaseUrl,
        hasApiKey: !!this.mayarApiKey,
        apiKeyLength: this.mayarApiKey?.length || 0,
        apiKeyStart: this.mayarApiKey ? this.mayarApiKey.substring(0, 30) + '...' : 'none',
      };

      console.error('❌ Mayar Donation Error:', errorDetails);
      
      // In production, throw error instead of fallback
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(
          'Gagal membuat payment link. Silakan coba lagi atau hubungi support.',
          500,
          'ERR_PAYMENT_CREATION_FAILED'
        );
      }
      
      // Fallback to mock only in development
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
    donorEmail?: string;
    donorPhone?: string;
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
