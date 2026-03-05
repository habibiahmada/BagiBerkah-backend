import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { PlayableService } from '../services/playable.service';

export class AIController {
  private service: AIService;
  private playableService: PlayableService;

  constructor() {
    this.service = new AIService();
    this.playableService = new PlayableService();
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

  generateQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic, difficulty, count = 5 } = req.body;

      if (!topic || !difficulty) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Topic and difficulty are required',
          },
        });
      }

      const questions = await this.playableService.generateQuiz(
        topic,
        difficulty,
        count
      );

      res.json({
        success: true,
        data: {
          questions,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

