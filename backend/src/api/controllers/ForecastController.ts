import { Request, Response, NextFunction } from 'express';
import { GetForecastsUseCase } from '../../application/use-cases/forecast/GetForecastsUseCase';
import { GetSkuForecastUseCase } from '../../application/use-cases/forecast/GetSkuForecastUseCase';
import { SaveColdStartUseCase } from '../../application/use-cases/forecast/SaveColdStartUseCase';
import { GenerateForecastsUseCase } from '../../application/use-cases/forecast/GenerateForecastsUseCase';

export class ForecastController {
  constructor(
    private readonly getForecastsUseCase: GetForecastsUseCase,
    private readonly getSkuForecastUseCase: GetSkuForecastUseCase,
    private readonly saveColdStartUseCase: SaveColdStartUseCase,
    private readonly generateForecastsUseCase?: GenerateForecastsUseCase
  ) {}

  public getForecasts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const horizon = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 14;
      const data = await this.getForecastsUseCase.execute(horizon);
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public getSkuForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const horizon = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 14;
      const data = await this.getSkuForecastUseCase.execute(req.params.sku, horizon);
      res.status(200).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public saveColdStart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.saveColdStartUseCase.execute({
        sku: req.body.sku,
        expectedDailySales: req.body.expectedDailySales,
        notes: req.body.notes,
        updatedBy: user?.userId,
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

  public generateForecasts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const horizonDays = req.body?.horizonDays ? parseInt(req.body.horizonDays as string, 10) : undefined;
      const result = await this.generateForecastsUseCase?.execute({ horizonDays });
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

