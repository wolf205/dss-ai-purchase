# Clean Architecture — Ranh giới 4 Tầng & Ma trận Phụ thuộc

## 1. Bản đồ Cấu trúc Thư mục

```
backend/src/
├── domain/                        # TẦNG 1: DOMAIN LAYER (Pure TypeScript, Zero Runtime Libs)
│   ├── entities/                  # Product, Supplier, Inventory, PurchaseOrder, etc.
│   ├── value-objects/             # SKU, POCode, RiskLevel, Money, WeightDistribution
│   ├── services/                  # InventoryCalculator, ABCXYZClassifier, OrderRoundingService
│   ├── repositories/              # IProductRepository, ISupplierRepository, etc. (Interfaces)
│   └── exceptions/                # DomainException, OutOfStockException, InvalidOrderStateException
├── application/                   # TẦNG 2: APPLICATION LAYER
│   ├── use-cases/                 # Các Use Case thực thi luồng người dùng
│   ├── dtos/                      # Request / Response DTOs
│   ├── exceptions/                # ApplicationException, EntityNotFoundException, DuplicateResourceException
│   └── ports/                     # IAIForecastClient, ITokenService, IPasswordHasher, IUnitOfWork
├── infrastructure/                # TẦNG 3: INFRASTRUCTURE LAYER
│   ├── database/                  # prisma.ts, PrismaUnitOfWork.ts
│   ├── repositories/              # PrismaProductRepository, PrismaInventoryRepository
│   ├── external-services/         # AxiosAIForecastClient.ts
│   ├── security/                  # BcryptPasswordHasher.ts, JwtTokenService.ts
│   └── file-parsers/              # ExcelFileParser.ts
└── api/                           # TẦNG 4: PRESENTATION / API LAYER
    ├── controllers/               # Express Controllers (gọi Use Case, map DTO)
    ├── middlewares/               # authMiddleware, validateMiddleware, errorMiddleware
    ├── validations/               # Zod Schemas
    └── routes/                    # Express Routers
```

---

## 2. Ma trận Quyền hạn & Cấm Phụ thuộc Chéo

| Tầng | Được phép Import | TUYỆT ĐỐI CẤM Import |
| :--- | :--- | :--- |
| **Domain** | Chỉ kiểu dữ liệu TypeScript nguyên bản, Domain Entities, Value Objects, Domain Services, Domain Repositories (Interfaces). | **CẤM 100%**: Application, Infrastructure, Presentation, Express, Prisma, các thư viện runtime bên ngoài (HTTP, Crypto, File, DB drivers), mã trạng thái HTTP. |
| **Application** | `Domain`, các Interfaces/Ports của chính tầng mình, Application DTOs, Application Exceptions. | **CẤM 100%**: Infrastructure (Prisma, Axios client cụ thể), Presentation (Express req/res, HTTP codes). Mọi tương tác môi trường phải trừu tượng hóa qua Ports. |
| **Infrastructure** | `Domain`, `Application` (để triển khai Ports/Interfaces), các thư viện bên thứ ba chuyên trách (PrismaClient, Bcrypt, Axios, ExcelJS). | **CẤM 100%**: Presentation Layer (Controllers, Express req/res, Route Handlers). |
| **Presentation** | `Domain`, `Application` (Use Cases, DTOs, Exceptions), Zod, Express framework. Infrastructure chỉ được phép import tại Composition Root để tiêm phụ thuộc (DI). | **CẤM 100%**: Thực thi truy vấn cơ sở dữ liệu hoặc logic nghiệp vụ trực tiếp trong Controller. Mọi hành động bắt buộc ủy quyền cho Use Cases. |

---

## 3. Nguyên tắc Độc lập Môi trường (Runtime Independence)

1. **Không rò rỉ cơ chế môi trường vào Core Logic:**
   - Tầng `Domain` và `Application` không được trực tiếp phụ thuộc vào các API riêng biệt của môi trường runtime (Node.js built-ins, OS-specific APIs, Database drivers).
   - Mọi nhu cầu tương tác với môi trường bên ngoài (băm mật khẩu, mã hóa token, gọi API AI, đọc file) **BẮT BUỘC** phải được định nghĩa dưới dạng **Port (Interface)** tại `application/ports/` và triển khai cụ thể tại `infrastructure/`.
2. **Chiến lược Quản lý Định danh Thực thể (Entity ID):**
   - Chiến lược định danh tuân thủ theo schema cơ sở dữ liệu (`docs/04-data-model/physical-schema.sql`).
   - Nếu cơ sở dữ liệu đảm nhiệm việc sinh ID (`gen_random_uuid()` / `@default(uuid())`), Domain Entity cho phép `id?: string` là trường tùy chọn khi khởi tạo mới. Tầng Application tuyệt đối không tự ý gọi thư viện runtime bên ngoài để sinh ID nếu không qua Port chuyên trách.

---

## 4. Composition Root (Dependency Injection)

- Việc lắp ghép giữa Interfaces (Ports) và Triển khai thực tế (Adapters) chỉ diễn ra tại Composition Root (thường là `app.ts` hoặc thư mục cấu hình container DI trong Presentation/Infrastructure).
- Controllers nhận Use Cases qua constructor hoặc hàm khởi tạo, Use Cases nhận Ports/Repositories qua constructor.
