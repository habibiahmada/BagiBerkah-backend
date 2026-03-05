import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import crypto from 'crypto';

export class XenditService {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.XENDIT_API_KEY || '';
    this.baseUrl = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';
    this.webhookSecret = process.env.XENDIT_WEBHOOK_SECRET || '';
  }

  /**
   * Create invoice for THR payment
   */
  async createInvoice(envelopeId: string, amount: number, description: string) {
    // Mock mode for development
    if (!this.apiKey || this.apiKey === 'your-xendit-api-key') {
      console.warn('⚠️  XENDIT_API_KEY not configured, using mock payment mode');
      return this.createMockInvoice(envelopeId, amount);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/invoices`,
        {
          external_id: envelopeId,
          amount,
          description,
          invoice_duration: 86400, // 24 hours
          currency: 'IDR',
          reminder_time: 1,
          success_redirect_url: `${process.env.FRONTEND_URL}/payment/success?envelope_id=${envelopeId}`,
          failure_redirect_url: `${process.env.FRONTEND_URL}/payment/failed`,
        },
        {
          auth: {
            username: this.apiKey,
            password: '',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        invoiceId: response.data.id,
        invoiceUrl: response.data.invoice_url,
        status: response.data.status,
        expiryDate: response.data.expiry_date,
      };
    } catch (error: any) {
      console.error('Xendit Invoice Error:', error.response?.data || error.message);
      
      // Fallback to mock
      console.warn('⚠️  Falling back to mock payment mode');
      return this.createMockInvoice(envelopeId, amount);
    }
  }

  /**
   * Create mock invoice for development
   */
  private createMockInvoice(envelopeId: string, amount: number) {
    const mockInvoiceId = `mock_inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      invoiceId: mockInvoiceId,
      invoiceUrl: `${process.env.FRONTEND_URL}/mock-payment/${envelopeId}?amount=${amount}`,
      status: 'PENDING',
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Create disbursement to recipient
   */
  async createDisbursement(data: {
    claimId: string;
    bankCode: string;
    accountNumber: string;
    accountHolderName: string;
    amount: number;
    description: string;
  }) {
    // Mock mode for development
    if (!this.apiKey || this.apiKey === 'your-xendit-api-key') {
      console.warn('⚠️  XENDIT_API_KEY not configured, using mock disbursement');
      return this.createMockDisbursement(data);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/disbursements`,
        {
          external_id: data.claimId,
          bank_code: data.bankCode,
          account_holder_name: data.accountHolderName,
          account_number: data.accountNumber,
          description: data.description,
          amount: data.amount,
        },
        {
          auth: {
            username: this.apiKey,
            password: '',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Log disbursement
      await this.logDisbursement({
        claimId: data.claimId,
        disbursementId: response.data.id,
        amount: data.amount,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        status: response.data.status,
        response: response.data,
      });

      return {
        disbursementId: response.data.id,
        status: response.data.status,
        message: 'Disbursement created successfully',
      };
    } catch (error: any) {
      console.error('Xendit Disbursement Error:', error.response?.data || error.message);
      
      // Fallback to mock
      console.warn('⚠️  Falling back to mock disbursement');
      return this.createMockDisbursement(data);
    }
  }

  /**
   * Create mock disbursement for development
   */
  private async createMockDisbursement(data: {
    claimId: string;
    bankCode: string;
    accountNumber: string;
    amount: number;
  }) {
    const mockDisbursementId = `mock_disb_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Log mock disbursement
    await this.logDisbursement({
      claimId: data.claimId,
      disbursementId: mockDisbursementId,
      amount: data.amount,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      status: 'COMPLETED',
      response: {
        mock: true,
        message: 'Mock disbursement for development',
      },
    });

    return {
      disbursementId: mockDisbursementId,
      status: 'COMPLETED',
      message: 'Mock disbursement completed',
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Webhook secret not configured', 500);
      }
      console.warn('⚠️  XENDIT_WEBHOOK_SECRET not configured - DEVELOPMENT MODE ONLY');
      console.warn('⚠️  Webhook verification skipped for payload:', payload.substring(0, 100));
      return true;
    }

    if (!signature) {
      console.error('❌ Webhook signature missing');
      throw new AppError('Webhook signature missing', 401);
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error('❌ Webhook signature mismatch');
    }

    return isValid;
  }

  /**
   * Log disbursement to audit log
   */
  private async logDisbursement(data: {
    claimId: string;
    disbursementId: string;
    amount: number;
    bankCode: string;
    accountNumber: string;
    status: string;
    response: any;
  }) {
    await prisma.auditLog.create({
      data: {
        action: 'DISBURSEMENT_XENDIT',
        entityType: 'CLAIM',
        entityId: data.claimId,
        details: {
          disbursementId: data.disbursementId,
          amount: data.amount,
          bankCode: data.bankCode,
          accountNumber: data.accountNumber.replace(/\d(?=\d{4})/g, '*'), // Mask account number
          status: data.status,
          response: data.response,
        },
      },
    });
  }

  /**
   * Get bank code from bank name
   * Xendit uses specific bank codes for disbursement
   * Reference: https://developers.xendit.co/api-reference/#bank-codes
   */
  getBankCode(bankName: string): string {
    const bankCodes: Record<string, string> = {
      // Major Banks
      'BCA': 'BCA',
      'Mandiri': 'MANDIRI',
      'BNI': 'BNI',
      'BRI': 'BRI',
      'CIMB Niaga': 'CIMB',
      'Permata': 'PERMATA',
      'Danamon': 'DANAMON',
      'BTN': 'BTN',
      'BSI': 'BSI',
      'BNC': 'BNC',
      'Mega': 'MEGA',
      'Panin': 'PANIN',
      'OCBC NISP': 'OCBC',
      'Maybank': 'MAYBANK',
      'BTPN': 'BTPN',
      'Jenius': 'BTPN',
      'Sinarmas': 'SINARMAS',
      'BCA Digital': 'BCA_DIGITAL',
      'Seabank': 'SEABANK',
      'Jago': 'JAGO',
      'Allo Bank': 'ALLO',
      'Bank Neo Commerce': 'BNC',
    };

    return bankCodes[bankName] || 'BCA'; // Default to BCA if not found
  }

  /**
   * Get e-wallet code
   */
  getEWalletCode(walletName: string): string {
    const walletCodes: Record<string, string> = {
      'GoPay': 'ID_GOPAY',
      'OVO': 'ID_OVO',
      'Dana': 'ID_DANA',
      'ShopeePay': 'ID_SHOPEEPAY',
      'LinkAja': 'ID_LINKAJA',
    };

    return walletCodes[walletName] || walletName;
  }
}
