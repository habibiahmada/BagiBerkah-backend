import { Request, Response, NextFunction } from 'express';
import { EnvelopeService } from '../services/envelope.service';
import { AppError } from '../middlewares/errorHandler';
import { validateBudgetAllocation, autoAdjustAllocation } from '../utils/helpers';

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

  validateAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { totalBudget, recipients } = req.body;
      
      const validation = validateBudgetAllocation(totalBudget, recipients);
      
      if (!validation.valid) {
        // Auto-adjust and return suggestion
        const adjusted = autoAdjustAllocation(totalBudget, recipients);
        
        return res.json({
          success: false,
          valid: false,
          message: validation.message,
          data: {
            totalBudget,
            totalAllocated: validation.totalAllocated,
            difference: validation.difference,
            adjustedRecipients: adjusted,
          },
        });
      }
      
      res.json({
        success: true,
        valid: true,
        message: 'Alokasi sudah sesuai dengan budget',
        data: {
          totalBudget,
          totalAllocated: validation.totalAllocated,
        },
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

  checkByAccessCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const envelope = await this.service.checkByAccessCode(req.body);
      
      res.json({
        success: true,
        data: envelope,
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
