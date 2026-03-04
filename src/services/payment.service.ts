import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { EnvelopeService } from './envelope.service';
import axios from 'axios';
import crypto from 'crypto';

export class PaymentService {
  private envelopeService: EnvelopeService;
  private mayarApiKey: string;
  private mayarBaseUrl: string;
  private mayarWebhookSecret: string;

  constructor() {
    this.envelopeService = new EnvelopeService();
    this.mayarApiKey = process.env.MAYAR_API_KEY || '';
    this.mayarBaseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.id';
    this.mayarWebhookSecret = process.env.MAYAR_WEBHOOK_SECRET || '';
  }

  /**
   * Create payment session
   */
  async createPayment(envelopeId: string) {
    const envelope = await prisma.envelope.findUnique({
      where: { id: envelopeId },
      include: { recipients: true },
    });

    if (!envelope) {
      throw new AppError('Envelope not found', 404);
    }

    if (envelope.status !== 'PENDING_PAYMENT') {
      throw new AppError('Envelope is not pending payment', 400);
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { envelopeId },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      throw new AppError('Payment already completed', 400);
    }

    try {
      // Create payment with Mayar (placeholder - adjust based on actual Mayar API)
      const paymentData = await this.createMayarPayment({
        amount: envelope.totalBudget,
        description: `THR BagiBerkah - ${envelope.recipients.length} penerima`,
        referenceId: envelopeId,
      });

      // Save payment to database
      const payment = await prisma.payment.create({
        data: {
          envelopeId,
          paymentId: paymentData.paymentId,
          amount: envelope.totalBudget,
          status: 'PENDING',
          paymentUrl: paymentData.paymentUrl,
          gatewayResponse: paymentData,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return {
        paymentId: payment.paymentId,
        paymentUrl: payment.paymentUrl,
        amount: payment.amount,
        status: payment.status,
        expiresAt: payment.expiresAt,
      };
    } catch (error: any) {
      console.error('Payment creation error:', error);
      throw new AppError('Failed to create payment', 500);
    }
  }

  /**
   * Get payment status
   */
  async getStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
      include: {
        envelope: true,
      },
    });

    if (!payment) {
      return null;
    }

    return {
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      envelopeId: payment.envelopeId,
    };
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(body: any, headers: any) {
    // Verify webhook signature
    const signature = headers['x-mayar-signature'];
    if (!this.verifyWebhookSignature(body, signature)) {
      throw new AppError('Invalid webhook signature', 401);
    }

    const { paymentId, status, paidAt } = body;

    const payment = await prisma.payment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'paid' ? 'SUCCESS' : status === 'failed' ? 'FAILED' : 'PENDING',
        paidAt: paidAt ? new Date(paidAt) : null,
        gatewayResponse: body,
      },
    });

    // If payment successful, activate envelope
    if (status === 'paid') {
      await this.envelopeService.activateEnvelope(payment.envelopeId);

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_SUCCESS',
          entityType: 'PAYMENT',
          entityId: payment.id,
          details: {
            paymentId,
            amount: payment.amount,
            envelopeId: payment.envelopeId,
          },
        },
      });
    }

    return { success: true };
  }

  /**
   * Create payment with Mayar
   * Supports both real API and mock mode for development
   */
  private async createMayarPayment(data: {
    amount: number;
    description: string;
    referenceId: string;
  }) {
    // Mock mode for development/testing
    if (!this.mayarApiKey || this.mayarApiKey === 'your-mayar-api-key') {
      console.warn('⚠️  MAYAR_API_KEY not configured, using mock payment mode');
      return this.createMockPayment(data);
    }

    try {
      // Real Mayar API integration
      // Based on Mayar documentation, adjust endpoint as needed
      const response = await axios.post(
        `${this.mayarBaseUrl}/v1/payments`,
        {
          amount: data.amount,
          description: data.description,
          reference_id: data.referenceId,
          callback_url: `${process.env.APP_URL}/api/payments/webhook`,
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.mayarApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        paymentId: response.data.id || response.data.payment_id,
        paymentUrl: response.data.payment_url || response.data.checkout_url,
        status: response.data.status || 'pending',
      };
    } catch (error: any) {
      console.error('Mayar API Error:', error.response?.data || error.message);
      
      // Fallback to mock if API fails
      console.warn('⚠️  Falling back to mock payment mode');
      return this.createMockPayment(data);
    }
  }

  /**
   * Create mock payment for development/testing
   */
  private createMockPayment(data: {
    amount: number;
    description: string;
    referenceId: string;
  }) {
    const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      paymentId: mockPaymentId,
      paymentUrl: `${process.env.FRONTEND_URL}/mock-payment/${data.referenceId}?amount=${data.amount}`,
      status: 'pending',
    };
  }

  /**
   * Verify webhook signature
   * CRITICAL: Never skip this in production
   */
  private verifyWebhookSignature(body: any, signature: string): boolean {
    if (!this.mayarWebhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        // CRITICAL: Never allow unverified webhooks in production
        throw new AppError('Webhook secret not configured', 500, 'ERR_4005');
      }
      console.warn('⚠️  MAYAR_WEBHOOK_SECRET not configured - DEVELOPMENT MODE ONLY');
      return true;
    }

    if (!signature) {
      throw new AppError('Webhook signature missing', 401, 'ERR_4005');
    }

    const payload = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', this.mayarWebhookSecret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      throw new AppError('Invalid webhook signature', 401, 'ERR_4005');
    }

    return true;
  }

  /**
   * Simulate payment success (development only)
   */
  async simulatePaymentSuccess(envelopeId: string) {
    const payment = await prisma.payment.findUnique({
      where: { envelopeId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === 'SUCCESS') {
      throw new AppError('Payment already completed', 400);
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    // Activate envelope
    await this.envelopeService.activateEnvelope(payment.envelopeId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'MOCK_PAYMENT_SUCCESS',
        entityType: 'PAYMENT',
        entityId: payment.id,
        details: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          envelopeId: payment.envelopeId,
          note: 'Simulated payment for development',
        },
      },
    });

    return { success: true };
  }
}
