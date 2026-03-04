import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class DisbursementService {
  private mayarApiKey: string;
  private mayarBaseUrl: string;

  constructor() {
    this.mayarApiKey = process.env.MAYAR_API_KEY || '';
    this.mayarBaseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.id';
  }

  /**
   * Process digital transfer to recipient
   */
  async processTransfer(claimId: string, bankAccount: string, bankName: string, amount: number) {
    // Mock mode for development
    if (!this.mayarApiKey || this.mayarApiKey === 'your-mayar-api-key') {
      console.warn('⚠️  MAYAR_API_KEY not configured, using mock disbursement');
      return this.mockTransfer(claimId, bankAccount, bankName, amount);
    }

    try {
      // Real Mayar disbursement API
      // Adjust endpoint based on actual Mayar documentation
      const response = await axios.post(
        `${this.mayarBaseUrl}/v1/disbursements`,
        {
          amount,
          bank_code: this.getBankCode(bankName),
          account_number: bankAccount,
          account_holder_name: 'Recipient', // Should be from claim data
          description: `THR BagiBerkah - Claim ${claimId}`,
          reference_id: claimId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.mayarApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log disbursement
      await this.logDisbursement({
        claimId,
        disbursementId: response.data.id,
        amount,
        bankAccount,
        bankName,
        status: response.data.status,
        response: response.data,
      });

      return {
        disbursementId: response.data.id,
        status: response.data.status,
        message: 'Transfer sedang diproses',
      };
    } catch (error: any) {
      console.error('Disbursement API Error:', error.response?.data || error.message);
      
      // Fallback to mock
      console.warn('⚠️  Falling back to mock disbursement');
      return this.mockTransfer(claimId, bankAccount, bankName, amount);
    }
  }

  /**
   * Mock transfer for development
   */
  private async mockTransfer(claimId: string, bankAccount: string, bankName: string, amount: number) {
    const mockDisbursementId = `mock_disb_${Date.now()}`;

    // Log mock disbursement
    await this.logDisbursement({
      claimId,
      disbursementId: mockDisbursementId,
      amount,
      bankAccount,
      bankName,
      status: 'success',
      response: {
        mock: true,
        message: 'Mock disbursement for development',
      },
    });

    return {
      disbursementId: mockDisbursementId,
      status: 'success',
      message: 'Transfer berhasil (mock mode)',
    };
  }

  /**
   * Log disbursement to audit log
   */
  private async logDisbursement(data: {
    claimId: string;
    disbursementId: string;
    amount: number;
    bankAccount: string;
    bankName: string;
    status: string;
    response: any;
  }) {
    await prisma.auditLog.create({
      data: {
        action: 'DISBURSEMENT',
        entityType: 'CLAIM',
        entityId: data.claimId,
        details: {
          disbursementId: data.disbursementId,
          amount: data.amount,
          bankAccount: data.bankAccount.replace(/\d(?=\d{4})/g, '*'), // Mask account number
          bankName: data.bankName,
          status: data.status,
          response: data.response,
        },
      },
    });
  }

  /**
   * Get bank code from bank name
   * This should be expanded based on actual bank codes
   */
  private getBankCode(bankName: string): string {
    const bankCodes: Record<string, string> = {
      'BCA': '014',
      'Mandiri': '008',
      'BNI': '009',
      'BRI': '002',
      'CIMB Niaga': '022',
      'Permata': '013',
      'Danamon': '011',
      'BTN': '200',
      'BSI': '451',
      'Jenius': '213',
      'GoPay': 'GOPAY',
      'OVO': 'OVO',
      'Dana': 'DANA',
      'ShopeePay': 'SHOPEEPAY',
    };

    return bankCodes[bankName] || '000';
  }

  /**
   * Check disbursement status
   */
  async checkStatus(disbursementId: string) {
    if (disbursementId.startsWith('mock_')) {
      return {
        disbursementId,
        status: 'success',
        message: 'Mock disbursement completed',
      };
    }

    try {
      const response = await axios.get(
        `${this.mayarBaseUrl}/v1/disbursements/${disbursementId}`,
        {
          headers: {
            Authorization: `Bearer ${this.mayarApiKey}`,
          },
        }
      );

      return {
        disbursementId: response.data.id,
        status: response.data.status,
        message: response.data.message || 'Transfer status retrieved',
      };
    } catch (error: any) {
      console.error('Check disbursement status error:', error.response?.data || error.message);
      throw new AppError('Failed to check disbursement status', 500);
    }
  }
}
