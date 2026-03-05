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

  /**
   * Handle Mayar webhook for donation status updates
   */
  handleWebhook = async (req: Request, res: Response) => {
    try {
      // Mayar webhook format:
      // {
      //   event: "payment.received",
      //   data: {
      //     id: "webhook_id",
      //     status: true,
      //     productId: "donation_1234567890",
      //     amount: 50000,
      //     customerName: "Ahmad",
      //     ...
      //   }
      // }
      
      const { event, data } = req.body;

      console.log('📥 Mayar Donation Webhook:', { 
        event, 
        productId: data?.productId,
        status: data?.status,
        amount: data?.amount 
      });

      // Handle payment.received event
      if (event === 'payment.received' && data?.status === true) {
        // productId contains our externalId (donation_timestamp)
        const externalId = data.productId;
        
        if (!externalId) {
          console.error('❌ Missing productId in webhook data');
          return res.status(400).json({ 
            success: false, 
            error: 'Missing productId' 
          });
        }

        // Update donation status to SUCCESS
        await this.donationService.updateDonationStatusByExternalId(externalId, 'SUCCESS');
        
        console.log('✅ Donation status updated to SUCCESS:', externalId);
      } else {
        console.log('ℹ️ Webhook event ignored:', event);
      }

      // Always return 200 to acknowledge webhook
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('❌ Webhook Error:', error);
      // Still return 200 to prevent Mayar from retrying
      res.status(200).json({ 
        success: false,
        error: error.message 
      });
    }
  };
}
