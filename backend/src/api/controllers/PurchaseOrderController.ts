import { Request, Response } from 'express';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/CreatePurchaseOrderUseCase';
import { GetPurchaseOrdersUseCase } from '../../application/use-cases/purchase-orders/GetPurchaseOrdersUseCase';
import { GetPurchaseOrderByIdUseCase } from '../../application/use-cases/purchase-orders/GetPurchaseOrderByIdUseCase';
import { ConfirmPurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/ConfirmPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/purchase-orders/CancelPurchaseOrderUseCase';
import { ReceiveGoodsUseCase } from '../../application/use-cases/purchase-orders/ReceiveGoodsUseCase';

export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderUseCase: CreatePurchaseOrderUseCase,
    private readonly getPurchaseOrdersUseCase: GetPurchaseOrdersUseCase,
    private readonly getPurchaseOrderByIdUseCase: GetPurchaseOrderByIdUseCase,
    private readonly confirmPurchaseOrderUseCase: ConfirmPurchaseOrderUseCase,
    private readonly cancelPurchaseOrderUseCase: CancelPurchaseOrderUseCase,
    private readonly receiveGoodsUseCase: ReceiveGoodsUseCase
  ) {}

  public listPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
    const filters = {
      supplierId: req.query.supplierId ? BigInt(req.query.supplierId as string) : undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const result = await this.getPurchaseOrdersUseCase.execute(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
      timestamp: new Date().toISOString(),
    });
  };

  public getPurchaseOrderById = async (req: Request, res: Response): Promise<void> => {
    const order = await this.getPurchaseOrderByIdUseCase.execute(BigInt(req.params.id));
    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  };

  public createPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const createdBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
    // Zod middleware should have transformed promisedDeliveryDate string into string. 
    // We convert it to Date for DTO
    const dto = {
      supplierId: req.body.supplierId,
      promisedDeliveryDate: new Date(req.body.promisedDeliveryDate),
      notes: req.body.notes,
      items: req.body.items,
      createdBy: createdBy
    };

    const order = await this.createPurchaseOrderUseCase.execute(dto);

    res.status(201).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  };

  public confirmPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const confirmedBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
    const dto = {
      poId: BigInt(req.params.id),
      confirmedBy: confirmedBy
    };

    const order = await this.confirmPurchaseOrderUseCase.execute(dto);

    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  };

  public cancelPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const cancelledBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
    const dto = {
      poId: BigInt(req.params.id),
      cancelledBy: cancelledBy,
      reason: req.body.reason
    };

    const order = await this.cancelPurchaseOrderUseCase.execute(dto);

    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  };

  public receiveGoods = async (req: Request, res: Response): Promise<void> => {
    const receivedBy = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
    const dto = {
      poId: BigInt(req.params.id),
      actualDeliveryDate: new Date(req.body.actualDeliveryDate),
      notes: req.body.notes,
      receivedBy: receivedBy,
      items: req.body.items
    };

    const order = await this.receiveGoodsUseCase.execute(dto);

    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  };
}
