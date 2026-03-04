import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';

export class AIController {
  private service: AIService;

  constructor() {
    this.service = new AIService();
  }

  allocate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allocation = await this.service.generateAllocation(req.body);
      
      res.json({
        success: true,
        data: allocation,
      });
    } catch (error) {
      next(error);
    }
  };

  generateGreeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const greeting = await this.service.generateGreeting(req.body);
      
      res.json({
        success: true,
        data: greeting,
      });
    } catch (error) {
      next(error);
    }
  };
}
