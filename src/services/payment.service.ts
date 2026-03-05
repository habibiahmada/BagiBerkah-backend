import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { EnvelopeService } from './envelope.service';
import { XenditService } from './xendit.service';

export class PaymentService {
  private envelopeService: EnvelopeService;
  private xenditService: XenditService;

  constructor() {
    this.envelopeService = new EnvelopeService();
    this.xenditService = new XenditService();
  }

  /**
   * Create payment session using Xendit
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
      // Create invoice with Xendit
      const invoiceData = await this.xenditService.createInvoice(
        envelopeId,
        envelope.totalBudget,
        `THR BagiBerkah - ${envelope.envelopeName} (${envelope.recipients.length} penerima)`
      );

      // Save payment to database
      const payment = await prisma.payment.create({
        data: {
          envelopeId,
          paymentId: invoiceData.invoiceId,
          amount: envelope.totalBudget,
          status: 'PENDING',
          paymentUrl: invoiceData.invoiceUrl,
          gatewayResponse: invoiceData,
          expiresAt: new Date(invoiceData.expiryDate),
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
   * Handle Xendit webhook
   */
  async handleWebhook(body: any, headers: any) {
    // Log webhook received for audit
    console.log('📥 Xendit webhook received:', {
      event: body.status,
      id: body.id,
      external_id: body.external_id,
      timestamp: new Date().toISOString(),
    });

    // Verify webhook signature
    const signature = headers['x-callback-token'];
    const payload = JSON.stringify(body);
    
    if (!this.xenditService.verifyWebhookSignature(payload, signature)) {
      console.error('❌ Invalid webhook signature from:', headers['x-forwarded-for'] || 'unknown');
      throw new AppError('Invalid webhook signature', 401);
    }

    console.log('✅ Webhook signature verified');

    const { id, external_id, status, paid_at } = body;

    const payment = await prisma.payment.findFirst({
      where: { 
        OR: [
          { paymentId: id },
          { envelopeId: external_id }
        ]
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Map Xendit status to our status
    let paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' = 'PENDING';
    if (status === 'PAID' || status === 'SETTLED') {
      paymentStatus = 'SUCCESS';
    } else if (status === 'EXPIRED') {
      paymentStatus = 'EXPIRED';
    } else if (status === 'FAILED') {
      paymentStatus = 'FAILED';
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paidAt: paid_at ? new Date(paid_at) : null,
        gatewayResponse: body,
      },
    });

    // If payment successful, activate envelope
    if (paymentStatus === 'SUCCESS') {
      await this.envelopeService.activateEnvelope(payment.envelopeId);

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_SUCCESS_XENDIT',
          entityType: 'PAYMENT',
          entityId: payment.id,
          details: {
            paymentId: id,
            amount: payment.amount,
            envelopeId: payment.envelopeId,
          },
        },
      });
    }

    return { success: true };
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
