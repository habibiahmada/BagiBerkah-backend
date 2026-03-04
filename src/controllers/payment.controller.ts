import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../middlewares/errorHandler';

export class PaymentController {
  private service: PaymentService;

  constructor() {
    this.service = new PaymentService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { envelopeId } = req.body;
      const payment = await this.service.createPayment(envelopeId);
      
      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;
      const status = await this.service.getStatus(paymentId);
      
      if (!status) {
        throw new AppError('Payment not found', 404);
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.handleWebhook(req.body, req.headers);
      
      res.json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error) {
      next(error);
    }
  };
}
