import { Request, Response, NextFunction } from 'express';
import { GetPurchaseRecommendationsUseCase } from '../../application/use-cases/recommendations/GetPurchaseRecommendationsUseCase';
import { RunDssAnalysisUseCase } from '../../application/use-cases/recommendations/RunDssAnalysisUseCase';

export class RecommendationController {
  constructor(
    private readonly getRecommendationsUseCase: GetPurchaseRecommendationsUseCase,
    private readonly runDssAnalysisUseCase: RunDssAnalysisUseCase
  ) {}

  public getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const horizonDays = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 14;
      const urgencyLevel = req.query.urgencyLevel as string | undefined;
      const category = req.query.category as string | undefined;

      const data = await this.getRecommendationsUseCase.execute({
        horizonDays,
        urgencyLevel,
        category,
      });

      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public runAnalysis = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.runDssAnalysisUseCase.execute();
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}
