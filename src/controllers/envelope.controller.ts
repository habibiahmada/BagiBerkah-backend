import { Request, Response, NextFunction } from 'express';
import { EnvelopeService } from '../services/envelope.service';
import { AppError } from '../middlewares/errorHandler';

export class EnvelopeController {
  private service: EnvelopeService;

  constructor() {
    this.service = new EnvelopeService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const envelope = await this.service.create(req.body);
      res.status(201).json({
        success: true,
        data: envelope,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const envelope = await this.service.getById(id);
      
      if (!envelope) {
        throw new AppError('Envelope not found', 404);
      }

      res.json({
        success: true,
        data: envelope,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const status = await this.service.getStatus(id);
      
      if (!status) {
        throw new AppError('Envelope not found', 404);
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const envelope = await this.service.update(id, req.body);
      
      res.json({
        success: true,
        data: envelope,
      });
    } catch (error) {
      next(error);
    }
  };
}
