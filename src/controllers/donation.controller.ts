import { Request, Response } from 'express';
import { DonationService } from '../services/donation.service';

export class DonationController {
  private donationService: DonationService;

  constructor() {
    this.donationService = new DonationService();
  }

  /**
   * Create donation payment link
   */
  createDonation = async (req: Request, res: Response) => {
    try {
      const { amount, donorName, message } = req.body;

      const donation = await this.donationService.createDonation({
        amount,
        donorName,
        message,
      });

      res.status(201).json({
        success: true,
        data: donation,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'ERR_5000',
          message: error.message || 'Internal server error',
        },
      });
    }
  };

  /**
   * Get donation statistics
   */
  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.donationService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'ERR_5000',
          message: error.message || 'Internal server error',
        },
      });
    }
  };
}
