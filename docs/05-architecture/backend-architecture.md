# Backend Architecture: Thiết Kế Kiến Trúc Clean Architecture

---

## 1. Tổng Quan Kiến Trúc Clean Architecture

Khối Backend được xây dựng bằng **Node.js + Express + TypeScript**, tuân thủ nghiêm ngặt nguyên lý **Clean Architecture** (Kiến trúc cùi hành - Onion Architecture). 

Nguyên tắc bất di bất dịch của kiến trúc là **Quy tắc phụ thuộc (The Dependency Rule)**:
$$\text{Mã nguồn bên ngoài chỉ được phép phụ thuộc vào mã nguồn bên trong; tầng bên trong tuyệt đối không biết gì về tầng bên ngoài.}$$

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLEAN ARCHITECTURE LAYERS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. DOMAIN LAYER (Cốt lõi - Pure TypeScript, Không phụ thuộc thư viện ngoài)│
│    • Entities (Product, PurchaseOrder, InventoryPosition...)                │
│    • Value Objects (SKU, POCode, Money, RiskLevel...)                       │
│    • Domain Services (SS/ROP Calculator, MOQ Rounding, ABC/XYZ...)          │
│    • Repository Interfaces / Ports (IProductRepository...)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. APPLICATION LAYER (Điều phối Use Cases nghiệp vụ)                        │
│    • Use Case Interactors (CreatePO, ReceiveGoods, RunDSSPipeline...)       │
│    • Request / Response DTOs                                                │
│    • Service Ports (IAIForecastClient, ITokenService, IUnitOfWork...)       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INFRASTRUCTURE LAYER (Tương tác công nghệ & Cơ sở dữ liệu)               │
│    • Database: Prisma ORM Client & Migrations                               │
│    • Repository Implementations (PrismaProductRepository...)                │
│    • External HTTP Client: AxiosAIForecastClient -> Python Service          │
│    • Security: BcryptPasswordHasher, JwtTokenService                        │
│    • File Parser: ExcelJS / Fast-CSV Ingestion                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. PRESENTATION / API LAYER (Điểm vào HTTP Express)                         │
│    • Express Routers & Controllers                                          │
│    • Middlewares: AuthMiddleware (JWT), RBACMiddleware, ErrorHandler        │
│    • Input Validation: Zod Schemas                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cấu Trúc Thư Mục Dự Án Backend (Project Tree Structure)

```
backend/
├── prisma/
│   ├── schema.prisma                  # Định nghĩa schema cơ sở dữ liệu cho Prisma ORM
│   ├── migrations/                    # Lịch sử các bản migration SQL
│   └── seed.ts                        # Dữ liệu khởi tạo (Admin, Trọng số mặc định)
├── src/
│   ├── domain/                        # TẦNG 1: DOMAIN LAYER
│   │   ├── entities/                  # Thực thể nghiệp vụ
│   │   │   ├── Product.ts
│   │   │   ├── Supplier.ts
│   │   │   ├── Inventory.ts
│   │   │   ├── PurchaseOrder.ts
│   │   │   ├── PurchaseOrderItem.ts
│   │   │   └── DeliveryHistory.ts
│   │   ├── value-objects/             # Đối tượng giá trị bất biến
│   │   │   ├── SKU.ts
│   │   │   ├── POCode.ts
│   │   │   └── RiskLevel.ts
│   │   ├── services/                  # Nghiệp vụ tính toán thuần túy
│   │   │   ├── InventoryCalculator.ts # Tính IP, SS, ROP, Max Stock, DoS
│   │   │   ├── ABCXYZClassifier.ts    # Phân loại ma trận Pareto & CV
│   │   │   ├── OrderRoundingService.ts# Làm tròn theo MOQ & Pack Size
│   │   │   └── SupplierScoringService.ts # Chấm điểm 4 tiêu chí & tổng hợp
│   │   ├── repositories/              # Interfaces / Ports
│   │   │   ├── IProductRepository.ts
│   │   │   ├── ISupplierRepository.ts
│   │   │   ├── IInventoryRepository.ts
│   │   │   ├── IPurchaseOrderRepository.ts
│   │   │   ├── ISalesHistoryRepository.ts
│   │   │   └── IDeliveryHistoryRepository.ts
│   │   └── exceptions/                # Domain Exceptions
│   │       ├── DomainException.ts
│   │       ├── InvalidOrderStateException.ts
│   │       └── OutOfStockException.ts
│   │
│   ├── application/                   # TẦNG 2: APPLICATION LAYER
│   │   ├── use-cases/                 # Triển khai 17 Use Cases (UC-001 -> UC-017)
│   │   │   ├── product/
│   │   │   │   ├── CreateProductUseCase.ts
│   │   │   │   └── UpdateProductUseCase.ts
│   │   │   ├── inventory/
│   │   │   │   ├── GetInventoryDashboardUseCase.ts
│   │   │   │   └── GetProductDetail360UseCase.ts
│   │   │   ├── forecast/
│   │   │   │   ├── GetDemandForecastUseCase.ts
│   │   │   │   └── SetColdStartEstimateUseCase.ts
│   │   │   ├── recommendation/
│   │   │   │   ├── GetSmartRecommendationsUseCase.ts
│   │   │   │   └── RunDSSPipelineUseCase.ts  # UC-011: Chạy lại toàn bộ DSS
│   │   │   ├── purchase-order/
│   │   │   │   ├── CreatePurchaseOrderUseCase.ts
│   │   │   │   ├── ConfirmPurchaseOrderUseCase.ts
│   │   │   │   └── CancelPurchaseOrderUseCase.ts
│   │   │   ├── goods-receipt/
│   │   │   │   └── ReceiveGoodsUseCase.ts    # UC-014: Nghiệm thu & Cập nhật kho
│   │   │   └── auth/
│   │   │       ├── LoginUseCase.ts
│   │   │       └── ManageUserUseCase.ts
│   │   ├── dtos/                      # Data Transfer Objects
│   │   │   ├── PurchaseOrderDTO.ts
│   │   │   ├── RecommendationDTO.ts
│   │   │   └── InventoryDashboardDTO.ts
│   │   └── ports/                     # Giao diện dịch vụ hạ tầng
│   │       ├── IAIForecastClient.ts
│   │       ├── ITokenService.ts
│   │       ├── IPasswordHasher.ts
│   │       └── IUnitOfWork.ts         # Quản trị Transaction ACID
│   │
│   ├── infrastructure/                # TẦNG 3: INFRASTRUCTURE LAYER
│   │   ├── database/
│   │   │   ├── prisma.ts              # Prisma Client singleton
│   │   │   └── PrismaUnitOfWork.ts    # Triển khai transaction bằng prisma.$transaction
│   │   ├── repositories/              # Triển khai Repository bằng Prisma
│   │   │   ├── PrismaProductRepository.ts
│   │   │   ├── PrismaInventoryRepository.ts
│   │   │   ├── PrismaPurchaseOrderRepository.ts
│   │   │   └── PrismaDeliveryHistoryRepository.ts
│   │   ├── external-services/
│   │   │   └── AxiosAIForecastClient.ts # Gọi HTTP sang Python FastAPI
│   │   ├── security/
│   │   │   ├── BcryptPasswordHasher.ts
│   │   │   └── JwtTokenService.ts
│   │   └── file-parsers/
│   │       └── ExcelFileParser.ts     # Đọc và validate file Excel/CSV
│   │
│   └── api/                           # TẦNG 4: PRESENTATION / API LAYER
│       ├── controllers/               # Express Controllers
│       │   ├── ProductController.ts
│       │   ├── InventoryController.ts
│       │   ├── RecommendationController.ts
│       │   ├── PurchaseOrderController.ts
│       │   ├── GoodsReceiptController.ts
│       │   └── AuthController.ts
│       ├── middlewares/
│       │   ├── authMiddleware.ts      # Xác thực Bearer JWT
│       │   ├── rbacMiddleware.ts      # Phân quyền ADMIN / STAFF
│       │   ├── validateMiddleware.ts  # Kiểm tra request body bằng Zod
│       │   └── errorMiddleware.ts     # Bắt lỗi toàn cục & chuẩn hóa format lỗi
│       ├── validations/               # Zod Schemas
│       │   ├── orderValidations.ts
│       │   └── productValidations.ts
│       ├── routes/                    # Express Router mapping
│       │   ├── productRoutes.ts
│       │   ├── inventoryRoutes.ts
│       │   ├── orderRoutes.ts
│       │   └── index.ts
│       └── server.ts                  # Khởi chạy Express Server
├── package.json
└── tsconfig.json
```

---

## 3. Chi Tiết Các Tầng Clean Architecture (Layer Deep-Dive)

### 3.1. Domain Layer: Trái Tim Nghiệp Vụ Của Hệ Thống

Tầng Domain chứa toàn bộ thực thể và các công thức toán học định lượng định nghĩa trong `02-requirements/business-rules.md`. Tầng này thuần túy viết bằng TypeScript, không import Express hay Prisma.

#### Minh họa Domain Service: Làm Tròn Số Lượng Mua (`BR-014`):

```typescript
// src/domain/services/OrderRoundingService.ts
export class OrderRoundingService {
  /**
   * Tính toán lượng mua đề xuất Q_suggested dựa trên Q_raw, MOQ và Pack Size
   * Công thức: Q_raw = Forecast + SS - (On-Hand + On-Order)
   * Q1 = max(Q_raw, MOQ)
   * Q_suggested = ceil(Q1 / PackSize) * PackSize
   */
  public static calculateSuggestedQuantity(
    rawShortage: number,
    moq: number = 1,
    packSize: number = 1
  ): number {
    if (rawShortage <= 0) {
      return 0; // Tồn kho vẫn đủ an toàn, không cần đặt
    }

    // Bước 1: Áp dụng số lượng đặt tối thiểu MOQ
    const q1 = Math.max(rawShortage, moq);

    // Bước 2: Làm tròn lên theo quy cách đóng gói (Thùng/Lốc/Hộp)
    const packs = Math.ceil(q1 / packSize);
    return packs * packSize;
  }
}
```

---

### 3.2. Application Layer: Điều Phối Use Case & Đảm Bảo ACID

Tầng Application nhận yêu cầu từ Controller, tương tác với các Port (Repository, AI Client, Unit of Work) để hoàn thành mục tiêu của tác tử.

#### Minh họa Use Case: Ghi Nhận Nhận Hàng & Cập Nhật Kho Nguyên Tử (`UC-014`, `BR-018`):

```typescript
// src/application/use-cases/goods-receipt/ReceiveGoodsUseCase.ts
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { DomainException } from '../../../domain/exceptions/DomainException';

export interface ReceiveGoodsItemDTO {
  sku: string;
  deliveredQuantity: number;
  defectiveQuantity: number;
}

export interface ReceiveGoodsRequestDTO {
  orderId: number;
  actualDeliveryDate: Date;
  receivedBy: string; // User UUID
  items: ReceiveGoodsItemDTO[];
  notes?: string;
}

export class ReceiveGoodsUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  public async execute(dto: ReceiveGoodsRequestDTO): Promise<void> {
    // Thực thi toàn bộ quy trình trong 1 Giao dịch nguyên tử (ACID Transaction)
    await this.uow.executeTransaction(async (tx) => {
      // 1. Kiểm tra đơn hàng tồn tại và đang ở trạng thái ORDERED
      const order = await tx.purchaseOrders.findById(dto.orderId);
      if (!order) {
        throw new DomainException('Không tìm thấy đơn mua hàng.');
      }
      if (order.status !== 'ORDERED') {
        throw new DomainException('Chỉ có thể nhận hàng cho đơn ở trạng thái ORDERED.');
      }

      let sumOrdered = 0;
      let sumDelivered = 0;
      let sumDefective = 0;
      let sumAccepted = 0;

      // 2. Cập nhật từng mặt hàng trong đơn và cập nhật tồn kho 2 chiều
      for (const item of dto.items) {
        if (item.defectiveQuantity > item.deliveredQuantity) {
          throw new DomainException(`Hàng lỗi không thể lớn hơn số lượng giao cho SKU ${item.sku}`);
        }

        const acceptedQty = item.deliveredQuantity - item.defectiveQuantity;
        const orderLine = order.items.find(i => i.productSku === item.sku);
        if (!orderLine) continue;

        sumOrdered += orderLine.orderedQuantity;
        sumDelivered += item.deliveredQuantity;
        sumDefective += item.defectiveQuantity;
        sumAccepted += acceptedQty;

        // Cập nhật dòng chi tiết PO
        await tx.purchaseOrderItems.updateReceipt(dto.orderId, item.sku, {
          deliveredQuantity: item.deliveredQuantity,
          defectiveQuantity: item.defectiveQuantity,
          acceptedQuantity: acceptedQty,
        });

        // Cập nhật tồn kho nguyên tử: Tăng On-Hand, Giảm On-Order (BR-001, BR-018)
        await tx.inventory.adjustStockOnReceipt(item.sku, {
          acceptedQuantity: acceptedQty,
          orderedQuantity: orderLine.orderedQuantity,
        });
      }

      // 3. Đóng đơn hàng sang trạng thái RECEIVED (BR-025)
      await tx.purchaseOrders.updateStatus(dto.orderId, 'RECEIVED', {
        actualDeliveryDate: dto.actualDeliveryDate,
      });

      // 4. Đánh giá tiêu chí OTIF và ghi log delivery_history (BR-012, BR-019)
      const isOnTime = dto.actualDeliveryDate <= order.promisedDeliveryDate;
      const isInFull = sumDelivered >= sumOrdered;
      const isOtif = isOnTime && isInFull;
      const leadTimeDays = Math.max(0, Math.floor(
        (dto.actualDeliveryDate.getTime() - order.orderDate.getTime()) / (1000 * 3600 * 24)
      ));

      await tx.deliveryHistory.create({
        orderId: dto.orderId,
        supplierId: order.supplierId,
        promisedDate: order.promisedDeliveryDate,
        actualDeliveryDate: dto.actualDeliveryDate,
        totalOrderedQuantity: sumOrdered,
        totalDeliveredQuantity: sumDelivered,
        totalDefectiveQuantity: sumDefective,
        totalAcceptedQuantity: sumAccepted,
        leadTimeDays,
        isOnTime,
        isInFull,
        isOtif,
        notes: dto.notes,
        receivedBy: dto.receivedBy,
      });
    });
  }
}
```

---

### 3.3. Infrastructure Layer: Prisma ORM & Tích Hợp Client AI

Tầng Infrastructure phụ trách việc kết nối với thế giới bên ngoài (PostgreSQL, Python Service).

#### Prisma Transaction Client Wrapper (`IUnitOfWork`):

```typescript
// src/infrastructure/database/PrismaUnitOfWork.ts
import { PrismaClient } from '@prisma/client';
import { IUnitOfWork, ITransactionScope } from '../../application/ports/IUnitOfWork';

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  public async executeTransaction<T>(
    fn: (scope: ITransactionScope) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(async (prismaTx) => {
      // Đóng gói prismaTx thành các Transaction Repositories
      const scope: ITransactionScope = {
        purchaseOrders: new PrismaPurchaseOrderRepository(prismaTx),
        purchaseOrderItems: new PrismaPurchaseOrderItemRepository(prismaTx),
        inventory: new PrismaInventoryRepository(prismaTx),
        deliveryHistory: new PrismaDeliveryHistoryRepository(prismaTx),
      };
      return await fn(scope);
    }, {
      maxWait: 5000, // 5s timeout
      timeout: 10000 // 10s timeout
    });
  }
}
```

#### Axios Client Gọi Sang Python FastAPI Service:

```typescript
// src/infrastructure/external-services/AxiosAIForecastClient.ts
import axios from 'axios';
import { IAIForecastClient, ForecastInputDTO, ForecastResultDTO } from '../../application/ports/IAIForecastClient';

export class AxiosAIForecastClient implements IAIForecastClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  public async generateForecast(input: ForecastInputDTO): Promise<ForecastResultDTO> {
    // Gọi sang endpoint Python: POST /api/v1/forecast
    const response = await axios.post<ForecastResultDTO>(
      `${this.baseUrl}/api/v1/forecast`,
      input,
      { timeout: 4000 } // Timeout 4s để đảm bảo toàn hệ thống phản hồi < 5s (NFR-002)
    );
    return response.data;
  }
}
```

---

### 3.4. Presentation Layer: Express Controller & Zod Validation

Tầng Presentation đảm bảo request được xác thực và validate trước khi đẩy vào Application layer.

```typescript
// src/api/controllers/GoodsReceiptController.ts
import { Request, Response, NextFunction } from 'express';
import { ReceiveGoodsUseCase } from '../../application/use-cases/goods-receipt/ReceiveGoodsUseCase';
import { receiveGoodsSchema } from '../validations/orderValidations';

export class GoodsReceiptController {
  constructor(private readonly receiveGoodsUseCase: ReceiveGoodsUseCase) {}

  public receiveGoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate dữ liệu đầu vào bằng Zod
      const validatedData = receiveGoodsSchema.parse(req.body);

      // 2. Lấy User ID từ JWT Auth Middleware
      const userId = req.user.id;

      // 3. Thực thi Use Case
      await this.receiveGoodsUseCase.execute({
        orderId: Number(req.params.id),
        actualDeliveryDate: new Date(validatedData.actualDeliveryDate),
        receivedBy: userId,
        items: validatedData.items,
        notes: validatedData.notes,
      });

      res.status(200).json({
        success: true,
        message: 'Đã ghi nhận nhận hàng và cập nhật tồn kho thành công.',
      });
    } catch (error) {
      next(error); // Chuyển sang errorMiddleware tập trung
    }
  };
}
```

---

## 4. Cơ Chế Xử Lý Lỗi Toàn Cục (Centralized Error Handling)

Hệ thống chuẩn hóa phản hồi lỗi HTTP qua `errorMiddleware.ts`, giúp Frontend luôn nhận được mã lỗi rõ ràng:

```typescript
// src/api/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainException } from '../../domain/exceptions/DomainException';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Lỗi do Zod Validate dữ liệu đầu vào
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Dữ liệu đầu vào không hợp lệ.',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Lỗi vi phạm Quy tắc nghiệp vụ (Domain Exception)
  if (err instanceof DomainException) {
    return res.status(422).json({
      success: false,
      errorCode: 'BUSINESS_RULE_VIOLATION',
      message: err.message,
    });
  }

  // Lỗi chưa bắt được (Internal Server Error)
  console.error('Unhandled System Error:', err);
  return res.status(500).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Đã có sự cố hệ thống xảy ra. Vui lòng liên hệ Quản trị viên.',
  });
}
```

---

## 5. Kết Luận

Kiến trúc Backend với **Clean Architecture + Prisma ORM** mang lại 3 ưu thế vượt trội:
1. **Bảo vệ toàn vẹn logic nghiệp vụ:** 26 Quy tắc nghiệp vụ được cô lập trong Domain Layer, không bị xáo trộn khi thay đổi thư viện Express hay đổi ORM.
2. **Đảm bảo giao dịch ACID chuẩn xác:** Loại trừ hoàn toàn nguy cơ sai lệch tồn kho khi nhận hàng hoặc hủy đơn thông qua `PrismaUnitOfWork`.
3. **Dễ dàng kiểm thử tự động (Unit Test):** Các Use Cases và Domain Services có thể được kiểm thử 100% bằng Mock Repositories mà không cần kết nối tới cơ sở dữ liệu thật.
