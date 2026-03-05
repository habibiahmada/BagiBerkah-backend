import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { XenditService } from './xendit.service';

export class DisbursementService {
  private xenditService: XenditService;

  constructor() {
    this.xenditService = new XenditService();
  }

  /**
   * Process digital transfer to recipient using Xendit
   */
  async processTransfer(
    claimId: string,
    bankAccount: string,
    bankName: string,
    amount: number,
    accountHolderName: string
  ) {
    try {
      const bankCode = this.xenditService.getBankCode(bankName);
      
      const disbursement = await this.xenditService.createDisbursement({
        claimId,
        bankCode,
        accountNumber: bankAccount,
        accountHolderName,
        amount,
        description: `THR BagiBerkah - Claim ${claimId}`,
      });

      return {
        disbursementId: disbursement.disbursementId,
        status: disbursement.status,
        message: disbursement.message,
      };
    } catch (error: any) {
      console.error('Disbursement error:', error.message);
      throw new AppError('Failed to process disbursement', 500);
    }
  }

  /**
   * Check disbursement status
   */
  async checkStatus(disbursementId: string) {
    if (disbursementId.startsWith('mock_')) {
      return {
        disbursementId,
        status: 'COMPLETED',
        message: 'Mock disbursement completed',
      };
    }

    // For real Xendit disbursements, status is tracked via webhook
    // This method can be extended to query Xendit API if needed
    return {
      disbursementId,
      status: 'PROCESSING',
      message: 'Disbursement is being processed',
    };
  }
}
