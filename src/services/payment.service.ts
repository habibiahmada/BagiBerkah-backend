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
   * Create payment with Mayar (placeholder)
   */
  private async createMayarPayment(data: {
    amount: number;
    description: string;
    referenceId: string;
  }) {
    // This is a placeholder implementation
    // Replace with actual Mayar API integration

    if (!this.mayarApiKey) {
      console.warn('⚠️  MAYAR_API_KEY not configured, using mock payment');
      return {
        paymentId: `mock_${Date.now()}`,
        paymentUrl: `${process.env.APP_URL}/mock-payment/${data.referenceId}`,
        status: 'pending',
      };
    }

    try {
      const response = await axios.post(
        `${this.mayarBaseUrl}/v1/payments`,
        {
          amount: data.amount,
          description: data.description,
          reference_id: data.referenceId,
          callback_url: `${process.env.APP_URL}/api/payments/webhook`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.mayarApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        paymentId: response.data.id,
        paymentUrl: response.data.payment_url,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('Mayar API Error:', error.response?.data || error.message);
      throw new AppError('Payment gateway error', 500);
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(body: any, signature: string): boolean {
    if (!this.mayarWebhookSecret) {
      console.warn('⚠️  MAYAR_WEBHOOK_SECRET not configured, skipping verification');
      return true; // Skip verification in development
    }

    const payload = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', this.mayarWebhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }
}
