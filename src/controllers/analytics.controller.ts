import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDashboardData();
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnvelopeStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getEnvelopeStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getPaymentStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getDistributionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getDistributionStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await this.service.getRecentActivity(limit);
      
      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };
}
