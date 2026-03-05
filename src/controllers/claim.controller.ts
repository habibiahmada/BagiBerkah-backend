import { Request, Response, NextFunction } from 'express';
import { ClaimService } from '../services/claim.service';
import { AppError } from '../middlewares/errorHandler';

export class ClaimController {
  private service: ClaimService;

  constructor() {
    this.service = new ClaimService();
  }

  getByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const claim = await this.service.getByToken(String(token));
      
      if (!claim) {
        throw new AppError('Claim not found or expired', 404);
      }

      res.json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const claim = await this.service.submit(String(token), req.body);
      
      res.json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  };

  validateQR = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrToken } = req.body;
      const result = await this.service.validateQR(qrToken);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  completeGame = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await this.service.completeGame(String(token));
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

