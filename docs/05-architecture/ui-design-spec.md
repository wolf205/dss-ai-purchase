# Tài Liệu Đặc Tả Thiết Kế Giao Diện UI/UX Khớp Chuẩn Nghiệp Vụ
## Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Bán Lẻ Tích Hợp AI (DSS AI Purchase)

---

## 1. Tổng Quan & Bối Cảnh Nghiệp Vụ (Business Context & Design Philosophy)

### 1.1. Triết Lý Thiết Kế: Decision Support System (DSS) — Human-in-the-Loop
Hệ thống **DSS AI Purchase** không phải là một phần mềm ERP cồng kềnh, cũng không phải một ứng dụng CRUD nhập liệu cơ bản. Bản chất của hệ thống là **Hệ thống Hỗ trợ Ra Quyết định (Decision Support System)** phục vụ cho cửa hàng bán lẻ độc lập quy mô dưới 1.000 SKU:
* **Hỗ trợ, không thay thế con người (Human-in-the-loop):** AI và các thuật toán phân tích (Holt-Winters, Fallback SMA-7, Ma trận Pareto ABC-XYZ, Mô hình chấm điểm NCC) đóng vai trò cố vấn thông minh. Giao diện người dùng phải trao toàn quyền cho nhân viên mua hàng trong việc xem xét, điều chỉnh số lượng ($Q_{edit}$), hoán đổi nhà cung cấp (Supplier Override) và trực tiếp xác nhận chốt đơn mua.
* **Minh bạch và giải thích được (Explainable AI - XAI):** Mỗi con số gợi ý không được xuất hiện như một "hộp đen". Giao diện phải trả lời rõ ràng 3 câu hỏi của nhân viên mua hàng:
  1. *Tại sao mặt hàng này cần phải mua hôm nay?* (Dựa trên $\text{IP} \le \text{ROP}$, số ngày tồn kho còn lại DoS).
  2. *Tại sao lại đề xuất số lượng này?* (Căn cứ nhu cầu dự báo chu kỳ tới, mức bù đắp tồn kho an toàn SS, đã trừ đi hàng đang về On-Order và làm tròn theo MOQ/Pack Size).
  3. *Tại sao lại gợi ý đối tác này?* (Dựa trên bảng điểm tổng hợp $Score_{NCC}$, đơn giá, cam kết thời gian giao và tỷ lệ giao đúng hẹn OTIF).
* **Mạch lạc theo dòng chảy công việc (Workflow-Centric):** Giao diện phải dẫn dắt nhân viên đi theo luồng tự nhiên: **Giám sát cảnh báo $\longrightarrow$ Đánh giá khuyến nghị AI $\longrightarrow$ Gom đơn theo NCC $\longrightarrow$ Chốt đơn PO $\longrightarrow$ Ghi nhận hàng về kho $\longrightarrow$ Đánh giá lại đối tác**.

### 1.2. Phân Tích Chân Dung Người Dùng (Target Personas)

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│ 1. NHÂN VIÊN MUA HÀNG (Purchasing Staff)     │ 2. QUẢN TRỊ VIÊN / CHỦ CỬA HÀNG (Admin)      │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Mục tiêu: Đảm bảo kệ hàng không bị đứt gãy  │ • Mục tiêu: Kiểm soát chi phí vốn tồn kho,    │
│   (No Stockout) mà không gây ứ đọng vốn.     │   chất lượng đối tác và cấu hình hệ thống.    │
│ • Thói quen: Vào ca làm việc sáng, mở hệ      │ • Hành vi chính: Cấu hình trọng số NCC        │
│   thống xem danh sách hàng sắp hết, kiểm tra  │   (Price, OTIF, Quality, Lead time), phân     │
│   gợi ý của AI, gom đơn theo NCC và gửi PO.   │   quyền nhân viên, quản lý danh mục sản phẩm  │
│ • Nhu cầu UI: Thao tác nhanh, ít click chuột, │   và giám sát tổng quan sức khỏe tồn kho.     │
│   cảnh báo màu trực quan, gom đơn tự động.    │ • Nhu cầu UI: Bảng quản trị minh bạch, form   │
│                                               │   cấu hình slider trực quan, an toàn dữ liệu. │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Phân Tích Hiện Trạng & Khoảng Cách Nghiệp Vụ (Gap Analysis)

Sau khi đối chiếu giữa toàn bộ tài liệu nghiệp vụ (`docs/01-business/` đến `docs/03-use-cases/`, 34 FR, 26 BR, 17 Use Case) và mã nguồn Frontend hiện tại (`frontend/src/features/`), các khoảng cách cốt lõi (Gaps) được xác định như sau:

| STT | Vấn đề trong UI hiện tại | Nghiệp vụ chuẩn mực (`docs/`) | Tác động tiêu cực tới người dùng | Giải pháp tái thiết kế |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Trang Khuyến nghị (`UC-010`) thiếu bộ chọn chu kỳ dự báo $T$.** | `UC-010` Mục 4 yêu cầu chọn chu kỳ kế hoạch $T \in \{7, 14, 30\}$ ngày; số lượng mua $Q_{suggested}$ phụ thuộc trực tiếp vào $\text{Forecasted Demand}_T$. | Nhân viên không chủ động lập kế hoạch mua hàng theo tuần (7 ngày) hoặc tháng (30 ngày). | Bổ sung Segmented Button chọn 7 / 14 / 30 ngày ngay trên đầu bảng Khuyến nghị. |
| **2** | **Lỗi gom đơn hàng loạt (`Batch Grouping PO`) khi chọn nhiều sản phẩm.** | `UC-010` A1 & `UC-012`: Khi chọn nhiều sản phẩm của nhiều NCC khác nhau, hệ thống phải mở popup gom nhóm theo từng NCC và sinh các PO riêng biệt. | Hiện tại code PO modal chỉ lấy `prefilledItems[0]?.supplierId`, nếu chọn sản phẩm của 2 NCC khác nhau sẽ bị gộp sai đối tác hoặc lỗi nghiệp vụ. | Thiết kế **Hộp thoại Gom Đơn theo Nhà Cung Cấp (Batch Grouping Modal)** hiển thị tóm tắt từng PO theo từng NCC trước khi bấm xác nhận. |
| **3** | **Không cho sửa số lượng hoặc đổi NCC trực tiếp trên bảng Khuyến nghị.** | `UC-010` A2 & A3: Cho phép chỉnh sửa $Q_{edit}$ và dropdown đổi NCC ngay tại dòng (Human Override) kèm cảnh báo vi phạm MOQ/Pack Size. | Nhân viên bị động, không thể thương lượng giá hoặc chọn NCC quen thuộc nếu không vào tận form PO. | Thiết kế ô nhập số lượng tại dòng (Inline Editing) và Dropdown NCC kèm so sánh giá/lead time tức thời. |
| **4** | **Nghiệp vụ Nhận hàng (`UC-014`) bị giấu trong modal phụ, không có không gian riêng.** | `UC-014` & `FR-017`: Ghi nhận nhận hàng là một nghiệp vụ độc lập quan trọng (đối chiếu phiếu giao, đếm hàng lỗi, kiểm tra OTIF, xuất phiếu nhập kho). | Nhân viên khó theo dõi hôm nay có những đơn hàng nào dự kiến giao đến, dễ quên kiểm đếm và nhận hàng. | Tách thành module riêng **"Tiếp Nhận Hàng & Nhập Kho" (Goods Receipt Workspace)** trên thanh điều hướng hoặc tab chính trong Quản lý đơn. |
| **5** | **Bảng tồn kho (`UC-004`) thiếu thanh đo trực quan (Segmented Visual Gauge).** | `UC-004` Mục 4 yêu cầu thanh đo trực quan thể hiện vị trí $\text{IP}$ so với $\text{SS}, \text{ROP}, \text{Max Stock}$ để nhìn thấy ngay mức độ an toàn. | Hiện tại chỉ có các con số rời rạc (On-Hand, On-Order, ROP), nhân viên phải tự nhẩm trong đầu xem còn bao xa thì chạm đáy. | Tích hợp cột **"Vị Trí Tồn Kho Trực Quan"** bằng thanh bar 4 vùng màu (Đỏ $\rightarrow$ Vàng $\rightarrow$ Xanh $\rightarrow$ Tím) kèm vạch chỉ thị vị trí thực tế của $\text{IP}$. |
| **6** | **Thiếu nút "Đặt hàng ngay" từ dòng rủi ro trong Bảng Tồn Kho (`UC-004`).** | `UC-004` A3: Cho phép nhân viên bấm "Đặt hàng ngay" tại bất kỳ dòng nào bị `OUT_OF_STOCK`, `CRITICAL`, `WARNING` để nhảy thẳng vào tạo đơn. | Nhân viên phải chuyển trang thủ công, ghi nhớ mã SKU hoặc tìm kiếm lại. | Thêm nút "Đặt hàng nhanh" ở cột Thao tác, tự động đẩy SKU sang form lập đơn PO. |
| **7** | **Trang PO (`UC-012`, `UC-013`) thiếu chức năng In / Xuất phiếu đặt hàng chuẩn.** | `FR-027`, `UC-012` A3: Hệ thống phải cho phép xuất file PDF/Excel hoặc in Phiếu Đơn Mua Hàng để gửi đối tác qua Email/Zalo. | Nhân viên không có chứng từ giao dịch gửi cho nhà cung cấp sau khi chốt đơn `ORDERED`. | Thiết kế mẫu **Phiếu Đơn Mua Hàng (PO Printable Sheet)** chuẩn hóa và nút In/Xuất PDF trực tiếp trên giao diện. |
| **8** | **Màn hình Dự Báo AI (`UC-007`) chưa làm nổi bật liên kết với Cold Start (`UC-008`).** | `UC-007` & `UC-008`: Sản phẩm Cold Start (< 14 ngày) cần có nút nhập $D_{expected}$ trực tiếp ngay tại dòng sản phẩm đó. | Nút nhập Cold Start nằm tách biệt trên đầu trang khiến nhân viên không biết SKU nào trong bảng đang thiếu số liệu. | Gắn badge cảnh báo `COLD_START` màu cam kèm nút hành động "Nhập định mức" ngay tại dòng sản phẩm tương ứng. |

---

## 3. Kiến Trúc Thông Tin & Điều Hướng Chuẩn Nghiệp Vụ (Information Architecture)

Giao diện được phân bổ lại theo 4 khối nghiệp vụ logic, phản ánh đúng chu trình ra quyết định của cửa hàng bán lẻ:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DSS PURCHASE — HỆ THỐNG MENU ĐIỀU HƯỚNG                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. KHỐI HỖ TRỢ RA QUYẾT ĐỊNH (DECISION SUPPORT - CỐT LÕI HẰNG NGÀY)         │
│    ├── 📦 Giám Sát Tồn Kho & Rủi Ro   (/inventory)           [UC-004, UC-006]│
│    ├── ✨ Khuyến Nghị Mua Hàng AI      (/recommendations)     [UC-010, UC-011]│
│    ├── 📈 Dự Báo Nhu Cầu Tiêu Thụ    (/forecasting)         [UC-007, UC-008]│
│    └── 📊 Ma Trận Phân Loại ABC-XYZ  (/inventory/abc-xyz)   [UC-005]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. KHỐI THỰC THI GIAO DỊCH MUA HÀNG (OPERATIONS & EXECUTION)                │
│    ├── 🛒 Quản Lý Đơn Mua Hàng (PO)   (/purchase-orders)     [UC-012, UC-013]│
│    ├── 📥 Ghi Nhận Nhận Hàng Vào Kho  (/goods-receipt)       [UC-014]        │
│    └── 🏆 Đánh Giá & Xếp Hạng NCC    (/suppliers/evaluations)[UC-009]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. KHỐI DỮ LIỆU CƠ SỞ (MASTER DATA & INGESTION)                             │
│    ├── 🏷️ Danh Mục Hàng Hóa (SKU)     (/products)            [UC-001]        │
│    ├── 🚚 Danh Sách Nhà Cung Cấp      (/suppliers)           [UC-002]        │
│    └── 📤 Nạp Dữ Liệu Bán Hàng & Kho (/data-import)         [UC-003]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. KHỐI QUẢN TRỊ HỆ THỐNG (SYSTEM ADMINISTRATION - CHỈ DÀNH CHO ADMIN)      │
│    ├── 👥 Quản Lý Tài Khoản          (/system/users)        [UC-016]        │
│    └── ⚙️ Cấu Hình Trọng Số Đánh Giá (/system/weights)      [UC-017]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Đặc Tả Chi Tiết Từng Màn Hình Nghiệp Vụ (Screen Blueprints)

---

### 4.1. Màn Hình 1: Giám Sát Tồn Kho & Cảnh Báo Rủi Ro (`UC-004`, `UC-006`)
* **Mục tiêu:** Cung cấp bức tranh toàn cảnh về sức khỏe tồn kho theo thời gian thực; phát hiện ngay các mặt hàng đứt gãy hoặc tồn ứ vốn để hành động tức thì.
* **Đường dẫn:** `/inventory`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BỘ ĐIỀU KHIỂN & LÀM MỚI: [Giám Sát Tồn Kho & Cảnh Báo Rủi Ro]               [Lọc Ngành Hàng ▼] [🔄 Làm Mới Số Liệu] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHU VỰC 1: THẺ ĐẾM 5 CẤP ĐỘ RỦI RO & HÀNG BẤT ĐỘNG (CLICK ĐỂ LỌC NHANH DANH SÁCH BÊN DƯỚI)                    │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│ │ 🔴 HẾT HÀNG    │ │ 🟠 NGUY CẤP    │ │ 🟡 CẦN ĐẶT HÀNG│ │ 🟢 AN TOÀN     │ │ 🟣 TỒN ĐỌNG VỐN│ │ ⚠️ BẤT ĐỘNG │ │
│ │   (OUT_OF_STOCK│ │   (CRITICAL)   │ │   (WARNING)    │ │   (NORMAL)     │ │   (OVERSTOCK)  │ │ (DEAD_STOCK)│ │
│ │     4 SKU      │ │     12 SKU     │ │     18 SKU     │ │     145 SKU    │ │     8 SKU      │ │    3 SKU    │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHU VỰC 2: THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC                                                                     │
│ [🔍 Nhập mã SKU hoặc tên sản phẩm...]  [Tất cả mức rủi ro ▼]  [Tất cả nhóm ABC-XYZ ▼]  [Nút: Xem Toàn Bộ Đề Xuất AI ➔]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHU VỰC 3: BẢNG THEO DÕI TỒN KHO THỜI GIAN THỰC KÈM VỊ TRÍ TRỰC QUAN (SEGMENTED VISUAL GAUGE)                   │
│ ┌─────┬────────────────┬──────┬─────────┬──────────┬────────┬────────┬───────┬───────────────────┬────────┬──────┐ │
│ │MãSKU│Tên Hàng Hóa    │Nhóm  │TồnKho   │HàngChờVề │VịTríTồn│ĐiểmĐặt │SốNgày │Thanh Đo Mức TồnKho│Trạng   │Thao  │ │
│ │     │                │ABC-X │(On-Hand)│(On-Order)│(IP)    │(ROP)   │Đủ(DoS)│(Segmented Gauge)  │Thái    │Tác   │ │
│ ├─────┼────────────────┼──────┼─────────┼──────────┼────────┼────────┼───────┼───────────────────┼────────┼──────┤ │
│ │MILK1│Sữa Vinamilk 180│AX    │   12 hộp│   48 hộp │  60 hộp│ 120 hộp│ 2 ngày│ [🔴-▲-🟡──🟢──🟣] │CRITICAL│[Đặt] │ │
│ │COKE │Coca Cola 330ml │AY    │    0 lon│    0 lon │   0 lon│  96 lon│ 0 ngày│ [▲🔴──🟡──🟢──🟣] │HẾT HÀNG│[Đặt] │ │
│ │OIL-1│Dầu ăn Neptune 1│BX    │   45 chai│   0 chai │  45 chai│  40 chai│15 ngày│ [──🔴──🟡─▲🟢──🟣]│AN TOÀN │[Xem] │ │
│ └─────┴────────────────┴──────┴─────────┴──────────┴────────┴────────┴───────┴───────────────────┴────────┴──────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Chi tiết thành phần giao diện:
1. **Segmented Visual Gauge Bar (Cột thanh đo trực quan):**
   * Thanh chia làm 4 dải màu chuẩn hóa: Vùng đỏ ($0 \rightarrow \text{SS}$), Vùng vàng ($\text{SS} \rightarrow \text{ROP}$), Vùng xanh ($\text{ROP} \rightarrow \text{Max Stock}$), Vùng tím ($> \text{Max Stock}$).
   * Biểu tượng tam giác nhỏ $(\blacktriangle)$ trỏ đúng vị trí hiện tại của $\text{Inventory Position (IP)}$ giúp nhân viên nhận biết tức thì khoảng cách an toàn mà không cần đọc từng con số.
2. **Nút "Đặt hàng ngay" tại dòng:**
   * Chỉ kích hoạt đối với các dòng có nguy cơ đứt hàng (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`).
   * Khi click, hệ thống tự động mở Modal Lập Đơn Mua Hàng (`UC-012`), điền sẵn SKU, số lượng đề xuất tối ưu $Q_{suggested}$ và Nhà cung cấp phân phối tốt nhất.
3. **Màn hình Chi tiết Sản phẩm 360° (`UC-006` - SkuDetail360 Drawer/Modal):**
   * Khi click vào Mã SKU hoặc Tên sản phẩm, mở Drawer bên phải màn hình hiển thị đủ 4 khối:
     * *Khối 1:* Định danh, Giá vốn, On-Hand, On-Order, IP, SS, ROP, DoS.
     * *Khối 2:* Phân loại ABC-XYZ và lời khuyên chiến lược quản lý tồn kho tương ứng.
     * *Khối 3:* Biểu đồ chuỗi thời gian 30 ngày bán lịch sử + đường dự báo AI 14 ngày tới kèm dải mây biến động tin cậy 95%.
     * *Khối 4:* Bảng so sánh toàn bộ Nhà Cung Cấp đang phân phối SKU này (Đơn giá, MOQ, Lead time, Điểm hiệu suất $Score_{NCC}$ và nút *"Đặt hàng từ đối tác này"* tại từng dòng).

---

### 4.2. Màn Hình 2: Phân Tích Ma Trận 9 Ô ABC - XYZ (`UC-005`)
* **Mục tiêu:** Phân loại toàn bộ danh mục sản phẩm theo 2 chiều: Giá trị doanh số Pareto (A: 80%, B: 15%, C: 5%) và Độ ổn định nhu cầu qua hệ số biến thiên $CV$ (X: ổn định, Y: biến động vừa, Z: biến động cao/khó đoán).
* **Đường dẫn:** `/inventory/abc-xyz`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Ma Trận 9 Ô ABC - XYZ (UC-005)]                                                      [🔄 Làm Mới Dữ Liệu Phân Tích] │
│ Lời khuyên vận hành: Tập trung kiểm soát nghiêm ngặt nhóm AX, BX (Chủ lực). Cẩn trọng dự phòng với AZ, BZ.    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MA TRẬN 9 Ô TƯƠNG TÁC (CLICK VÀO BẤT KỲ Ô NÀO ĐỂ LỌC DANH SÁCH BÊN DƯỚI):                                      │
│                                                                                                                │
│          X (CV ≤ 0.5 - Ổn định)         Y (0.5 < CV ≤ 1.0 - Biến động vừa)    Z (CV > 1.0 - Khó đoán)          │
│       ┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐          │
│       │ Ô [AX]: 45 SKU (42.5% DS)    │ Ô [AY]: 18 SKU (24.1% DS)    │ Ô [AZ]: 8 SKU (13.4% DS)     │          │
│   A   │ • Chiến lược: Tự động hóa mua│ • Chiến lược: Dự báo Holt-W  │ • Chiến lược: Tăng đệm SS an │          │
│ (80%) │ • Tồn kho an toàn thấp       │ • Kiểm tra định kỳ theo tuần │ • Đặt hàng linh hoạt theo lô │          │
│       │ [🟢 Màu Xanh Lục Đậm]        │ [🟡 Màu Vàng Cam]            │ [🔴 Màu Đỏ Hồng]             │          │
│       ├──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤          │
│       │ Ô [BX]: 32 SKU (8.2% DS)     │ Ô [BY]: 25 SKU (4.5% DS)     │ Ô [BZ]: 12 SKU (2.3% DS)     │          │
│   B   │ • Chiến lược: Đặt định kỳ    │ • Chiến lược: Giữ tồn kho vừa│ • Chiến lược: Đặt theo thực tế│         │
│ (15%) │ [🟢 Màu Xanh Nhạt]           │ [🟡 Màu Vàng Nhạt]           │ [🟠 Màu Cam Nhạt]            │          │
│       ├──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤          │
│       │ Ô [CX]: 55 SKU (2.8% DS)     │ Ô [CY]: 40 SKU (1.5% DS)     │ Ô [CZ]: 30 SKU (0.7% DS)     │          │
│   C   │ • Chiến lược: Đặt số lượng lớn│ • Chiến lược: Đặt khi hết hàng│ • Chiến lược: Cân nhắc loại bỏ│        │
│ (5%)  │ [⚪ Màu Xám Xanh]            │ [⚪ Màu Xám Vàng]            │ [⚫ Màu Xám Đậm / Dead stock] │         │
│       └──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ DANH SÁCH SẢN PHẨM THEO PHÂN NHÓM ĐÃ CHỌN: ĐANG XEM Ô [AX] (45 SẢN PHẨM)             [✕ Bỏ lọc để xem tất cả]  │
│ [Bảng danh sách SKU: Mã SKU | Tên sản phẩm | Doanh thu 30N | Hệ số CV | Tồn kho IP | Khuyến nghị chiến lược]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Hành vi tương tác (Interaction Behavior):
* Khi người dùng nhấp vào một ô (ví dụ: `AX`), ô đó được làm nổi bật với viền xanh đậm; bảng sản phẩm bên dưới lập tức lọc danh sách các sản phẩm thuộc ô đó.
* Hiển thị thẻ chỉ dẫn chiến lược mua hàng tương ứng với ô đã chọn (Strategy Guidance Card).

---

### 4.3. Màn Hình 3: Khuyến Nghị Mua Hàng Thông Minh (`UC-010`, `UC-011`)
* **Mục tiêu:** Màn hình trung tâm quan trọng nhất của hệ thống. Tự động đề xuất danh sách mặt hàng cần mua, số lượng tối ưu, nhà cung cấp tốt nhất và lý do rõ ràng; cho phép gom đơn theo NCC và chuyển tiếp mượt mà sang tạo PO.
* **Đường dẫn:** `/recommendations`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [✨ Khuyến Nghị Mua Hàng Thông Minh (UC-010)]                                                                   │
│ Đề xuất số lượng đặt hàng tối ưu (Q_raw làm tròn theo MOQ & Pack Size) kèm đối tác uy tín nhất                │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BỘ CHỌN CHU KỲ KẾ HOẠCH & NÚT CHẠY LẠI PHÂN TÍCH:                                                              │
│ Chu kỳ kế hoạch mua hàng: [ (•) 7 Ngày ] [ ( ) 14 Ngày (Chuẩn) ] [ ( ) 30 Ngày ]    [⚡ Chạy Lại Phân Tích (UC-011)]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ THANH HÀNH ĐỘNG GHIM NỔI KHI CHỌN SẢN PHẨM (FLOATING BATCH ACTION BAR):                                         │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🛒 Đã chọn: 5 SKU  │  Tổng dự toán tiền nhập: 24.500.000 đ  │  Thuộc về: 2 Nhà Cung Cấp                    │ │
│ │ [Nút: Tạo Các Đơn Mua Hàng (Mở Hộp Thoại Gom Nhóm Theo NCC) ➔]                                             │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BẢNG DANH SÁCH ĐỀ XUẤT MUA HÀNG THÔNG MINH (TỰ ĐỘNG SẮP XẾP THEO MỨC ĐỘ KHẨN CẤP):                            │
│ ┌──┬─────────┬──────────────┬──────┬──────┬──────┬─────────────────┬──────┬─────────────────┬──────────┬─────┐ │
│ │☑ │Mã SKU   │Tên Hàng Hóa  │Cấp Độ│Tồn IP│Điểm  │SL Đề Xuất (Q_sug│Ngày  │Nhà Cung Cấp     │Dự Toán   │Giải │ │
│ │  │         │              │Rủi Ro│      │ROP   │[Cho Phép Sửa]   │Đặt   │Gợi Ý [Dropdown] │Chi Phí   │Thích│ │
│ ├──┼─────────┼──────────────┼──────┼──────┼──────┼─────────────────┼──────┼─────────────────┼──────────┼─────┤ │
│ │☑ │MILK-VNM │Sữa Vinamilk  │🔴 HẾT│ 12   │ 120  │ [ 120 ] thùng   │Hômnay│Vinamilk (95.4đ)▼│ 7.440.000│[❓] │ │
│ │  │         │              │      │      │      │ (MOQ:20, Thùng:4│Khẩn  │• Giá: 62.000 đ  │          │Lý do│ │
│ ├──┼─────────┼──────────────┼──────┼──────┼──────┼─────────────────┼──────┼─────────────────┼──────────┼─────┤ │
│ │☑ │TH-TRUE  │Sữa TH 1L     │🟠 CẤP│ 24   │  80  │ [  72 ] lốc     │Hômnay│TH True (91.2đ) ▼│ 3.240.000│[❓] │ │
│ │  │         │              │      │      │      │ (MOQ:12, Lốc:6) │      │• Giá: 45.000 đ  │          │Lý do│ │
│ ├──┼─────────┼──────────────┼──────┼──────┼──────┼─────────────────┼──────┼─────────────────┼──────────┼─────┤ │
│ │☐ │SNACK-01 │Bim Bim Oishi │🟡 WAR│ 50   │  60  │ [  40 ] gói     │+2ngày│Oishi VN (88.0đ)▼│   400.000│[❓] │ │
│ └──┴─────────┴──────────────┴──────┴──────┴──────┴─────────────────┴──────┴─────────────────┴──────────┴─────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Thành phần cốt lõi của màn hình Khuyến nghị:

1. **Bộ chọn Chu kỳ Kế hoạch Mua hàng ($T \in \{7, 14, 30\}$ ngày):**
   * Cho phép nhân viên thay đổi chu kỳ tính toán nhu cầu dự báo. Khi bấm chọn khung 7 ngày hay 30 ngày, hệ thống tự động tính lại tổng cầu $\text{Forecasted Demand}_T$ và cập nhật lại $Q_{suggested}$ tức thời.
2. **Sửa số lượng trực tiếp ($Q_{edit}$) & Cảnh báo mềm:**
   * Ô số lượng đề xuất cho phép nhân viên nhập số khác theo nhận định thực tế.
   * Nếu số mới nhỏ hơn MOQ hoặc không chia hết cho Pack Size, hiển thị viền vàng và tooltip cảnh báo nhẹ nhưng **không chặn hành động**, đúng tinh thần Human-in-the-loop.
3. **Dropdown Hoán đổi Nhà Cung Cấp (Human-in-the-Loop Override):**
   * Cho phép chọn đối tác khác cũng phân phối SKU này.
   * Khi chọn đối tác khác, hệ thống tự động cập nhật lại Đơn giá, MOQ, Lead time và tính toán lại Thành tiền tức thì.
4. **Thẻ Minh Bạch Lý Giải Quyết Định (Explainable Insights Modal/Drawer):**
   * Khi bấm vào nút `[❓]`, mở cửa sổ hiển thị 3 dòng giải thích rõ ràng:
     * *Căn cứ nhu cầu:* "Hàng sắp hết trong 2 ngày tới ($\text{DoS} = 2.1$). Dự kiến tiêu thụ 14 ngày tới là 85 hộp."
     * *Căn cứ số lượng:* "$Q_{raw} = 85 + 25 (\text{SS}) - 12 (\text{IP}) = 98$ hộp. Làm tròn theo quy cách thùng (24 hộp/thùng) và MOQ (20) $\rightarrow$ Đề xuất 120 hộp (5 thùng)."
     * *Căn cứ chọn NCC:* "Nhà cung cấp Vinamilk có điểm tổng cao nhất (95.4/100), cam kết giao trong 2 ngày và đạt 100% OTIF trong 10 lần giao gần nhất."
5. **Hộp Thoại Gom Nhóm Đơn Theo NCC (Batch Grouping Modal - Giải quyết Gap số 2):**
   * Khi nhân viên chọn nhiều SKU và bấm *"Tạo Các Đơn Mua Hàng"*, một Modal chuyên dụng sẽ xuất hiện tóm tắt:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📦 XÁC NHẬN GOM ĐƠN MUA HÀNG THEO NHÀ CUNG CẤP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Hệ thống tự động phân tách các mặt hàng đã chọn thành 2 đơn mua hàng riêng:  │
│                                                                             │
│ 1. Đơn mua hàng 1: CÔNG TY CỔ PHẦN SỮA VIỆT NAM (VINAMILK)                  │
│    • Số lượng: 3 SKU (Sữa tiệt trùng 180ml, Sữa chua có đường, Sữa hạt óc chó)│
│    • Ngày hẹn giao dự kiến: 10/09/2026 (Lead time: 2 ngày)                  │
│    • Tổng giá trị ước tính: 14.250.000 đ                                    │
│                                                                             │
│ 2. Đơn mua hàng 2: CÔNG TY TNHH TH TRUE MILK                                │
│    • Số lượng: 2 SKU (Sữa tươi tiệt trùng 1L, Bơ tự nhiên 200g)             │
│    • Ngày hẹn giao dự kiến: 11/09/2026 (Lead time: 3 ngày)                  │
│    • Tổng giá trị ước tính: 10.250.000 đ                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ [✕ Hủy bỏ]                  [✅ Xác Nhận Tạo Đồng Khởi 2 Đơn Mua Hàng (DRAFT)]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4. Màn Hình 4: Quản Lý & Lập Đơn Mua Hàng PO (`UC-012`, `UC-013`)
* **Mục tiêu:** Quản lý vòng đời đơn mua hàng qua máy trạng thái 4 cấp: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED`. Hỗ trợ lập đơn mới, chỉnh sửa, khóa đơn tăng On-Order và in/xuất phiếu đặt hàng gửi đối tác.
* **Đường dẫn:** `/purchase-orders`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛒 Quản Lý Đơn Mua Hàng (PO)]                                                     [➕ Lập Đơn Mua Hàng Mới]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB PHÂN LOẠI TRẠNG THÁI:                                                                                      │
│ [ Tất Cả (24) ]  [ 📝 Đơn Nháp - DRAFT (3) ]  [ 🚚 Chờ Giao - ORDERED (5) ]  [ ✅ Đã Nhận - RECEIVED (14) ]    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ DANH SÁCH ĐƠN MUA HÀNG:                                                                                        │
│ ┌──────────────┬──────────────────┬──────────┬──────────┬──────────┬──────────────┬──────────────┬───────────┐ │
│ │Mã Đơn PO     │Nhà Cung Cấp      │Ngày Tạo  │Hẹn Giao  │Số MặtHàng│Tổng Tiền (VNĐ│Trạng Thái    │Thao Tác   │ │
│ ├──────────────┼──────────────────┼──────────┼──────────┼──────────┼──────────────┼──────────────┼───────────┤ │
│ │PO-20260908-01│Vinamilk          │08/09/2026│10/09/2026│  3 SKU   │  14.250.000 đ│🚚 ORDERED    │[Nhận Hàng]│ │
│ │              │                  │          │          │          │              │(Đã khóa đơn) │[In Phiếu] │ │
│ ├──────────────┼──────────────────┼──────────┼──────────┼──────────┼──────────────┼──────────────┼───────────┤ │
│ │PO-20260908-02│TH True Milk      │08/09/2026│11/09/2026│  2 SKU   │  10.250.000 đ│📝 DRAFT      │[Sửa Đơn]  │ │
│ │              │                  │          │          │          │              │(Chưa chốt)   │[Chốt Đơn] │ │
│ ├──────────────┼──────────────────┼──────────┼──────────┼──────────┼──────────────┼──────────────┼───────────┤ │
│ │PO-20260905-01│Công ty Masan     │05/09/2026│07/09/2026│  5 SKU   │   8.120.000 đ│✅ RECEIVED   │[Xem Biên  │ │
│ │              │                  │          │          │          │              │(Đã vào kho)  │ Bản Nhập] │ │
│ └──────────────┴──────────────────┴──────────┴──────────┴──────────┴──────────────┴──────────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Giao diện Lập / Sửa Đơn Mua Hàng (`OrderFormModal` / Trang Lập Đơn):
* **Chọn Nhà Cung Cấp:** Dropdown chỉ cho phép chọn NCC đang hoạt động.
* **Tự động lọc sản phẩm phân phối:** Bảng chọn SKU chỉ liệt kê các sản phẩm thuộc danh mục phân phối của NCC đã chọn (ngăn chặn sai sót nghiệp vụ).
* **Kiểm tra MOQ & Pack Size:** Cảnh báo mềm khi số lượng chưa đạt MOQ.
* **Hai lựa chọn hoàn tất:**
  * *"Lưu đơn nháp (DRAFT)":* Lưu trữ đơn trên hệ thống, chưa làm thay đổi số lượng On-Order của sản phẩm.
  * *"Xác nhận đặt hàng (ORDERED)":* Khóa vĩnh viễn đơn hàng không cho sửa nữa, lập tức kích hoạt tăng tồn kho $\text{On-Order} += Q_{ordered}$ cho toàn bộ sản phẩm trong đơn, hiển thị nút In/Xuất file PDF phiếu đặt hàng.

---

### 4.5. Màn Hình 5: Không Gian Tiếp Nhận Hàng & Nhập Kho (`UC-014`)
* **Mục tiêu:** Màn hình chuyên trách phục vụ việc đối chiếu khi xe hàng đến cửa hàng; đếm số lượng thực giao, tách hàng lỗi, tự động cập nhật tồn kho On-Hand, giải phóng On-Order và ghi nhật ký chấm điểm OTIF cho NCC.
* **Đường dẫn:** `/goods-receipt` (hoặc mở trực tiếp từ nút [Nhận Hàng] tại các đơn `ORDERED`).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [📥 Phiếu Ghi Nhận Nhận Hàng & Nhập Kho Thực Tế (UC-014)]                                                      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ THÔNG TIN ĐƠN ĐỐI CHIẾU:                                                                                       │
│ Mã Đơn PO: PO-20260908-0001  │ Nhà Cung Cấp: CÔNG TY CỔ PHẦN VINAMILK  │ Ngày Hẹn Giao: 10/09/2026             │
│ Ngày Nhận Thực Tế: [ 10/09/2026 📅 ]  (Đúng hạn giao hàng ✅)          [⚡ Nút: Nhận Đủ 100% Không Lỗi (1-Click)]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BẢNG KIỂM ĐẾM CHI TIẾT TỪNG MẶT HÀNG TẠI CỬA HÀNG:                                                             │
│ ┌─────────┬──────────────────┬──────┬────────────┬─────────────┬────────────┬─────────────┬──────────────────┐ │
│ │Mã SKU   │Tên Sản Phẩm      │ĐVT   │SL Đặt Ban  │SL Thực Giao │SL Hỏng/Lỗi │SL Thực Nhập │Tác Động Tồn Kho  │ │
│ │         │                  │      │Đầu (Q_ord) │(Q_delivered)│(Q_defect)  │(Q_accepted) │(Sau khi xác nhận)│ │
│ ├─────────┼──────────────────┼──────┼────────────┼─────────────┼────────────┼─────────────┼──────────────────┤ │
│ │MILK-180 │Sữa tiệt trùng 180│Hộp   │    120     │   [ 120 ]   │   [  2  ]  │   118 hộp   │+118 On-Hand      │ │
│ │         │                  │      │            │             │(Móp vỏ hộp)│             │-120 On-Order     │ │
│ ├─────────┼──────────────────┼──────┼────────────┼─────────────┼────────────┼─────────────┼──────────────────┤ │
│ │YOG-100  │Sữa chua ăn 100g  │Hũ    │     48     │   [  48 ]   │   [  0  ]  │    48 hũ    │+48 On-Hand       │ │
│ │         │                  │      │            │             │            │             │-48 On-Order      │ │
│ └─────────┴──────────────────┴──────┴────────────┴─────────────┴────────────┴─────────────┴──────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ĐÁNH GIÁ HIỆU SUẤT GIAO HÀNG TỨC THỜI (OTIF PREVIEW):                                                          │
│ • Đúng hạn (On-Time): ĐẠT (Giao ngày 10/09 <= Hẹn 10/09)                                                      │
│ • Đủ lượng (In-Full): ĐẠT (Giao đủ 168/168 sản phẩm)                                                           │
│ • Tỷ lệ lỗi hàng: 1.19% (2/168 sản phẩm lỗi - sẽ trừ vào điểm Quality Score)                                   │
│ Ghi chú nhận hàng: [Thùng sữa tươi có 2 hộp bị bẹp góc do vận chuyển, đã lập biên bản đổi trả...]              │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [✕ Đóng Lại]                            [🖨️ In Phiếu Nhập Kho]       [✅ Xác Nhận Nhập Kho & Cập Nhật Tồn Kho]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Quy tắc giao dịch nguyên tử (Atomic Database Transaction Guarantee):
Khi bấm nút **[Xác Nhận Nhập Kho]**, hệ thống thông báo tóm tắt và thực hiện chuỗi giao dịch ACID:
1. Tăng tồn kho khả dụng $\text{On-Hand} += Q_{accepted}$.
2. Giảm trừ hàng chờ về $\text{On-Order} = \max(0, \text{On-Order} - Q_{ordered})$.
3. Chuyển trạng thái PO sang `RECEIVED`.
4. Ghi nhận log vào `DeliveryHistory` để tính điểm OTIF và chất lượng.
5. Tự động kích hoạt tính lại các chỉ số an toàn và xóa sản phẩm khỏi danh sách cần mua.

---

### 4.6. Màn Hình 6: Dự Báo Nhu Cầu Bán Lẻ AI & Cold Start (`UC-007`, `UC-008`)
* **Mục tiêu:** Trực quan hóa chuỗi thời gian tiêu thụ lịch sử và dự báo tương lai kèm dải mây biến động tin cậy (Confidence Interval Shaded Area); xử lý nhập liệu cho các sản phẩm mới ra mắt (< 14 ngày).
* **Đường dẫn:** `/forecasting`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [📈 Dự Báo Nhu Cầu Bán Hàng AI (UC-007)]                       Chu kỳ: [ 7 Ngày ] [ (•) 14 Ngày ] [ 30 Ngày ]  │
│ [⚡ Kích Hoạt Chạy Dự Báo AI Cho Chu Kỳ Đang Chọn]             [➕ Nhập Định Mức Sản Phẩm Mới (Cold Start)]    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHU VỰC TRỰC QUAN HÓA BIỂU ĐỒ CHUỖI THỜI GIAN VÀ DẢI MÂY TIN CẬY (APACHE ECHARTS):                              │
│ Đang xem sản phẩm: Sữa tươi tiệt trùng Vinamilk 180ml (MILK-VNM-180)                                           │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Số lượng (Đơn vị)                                                                                          │ │
│ │  60 ┤                                        /---\ (Dải mây biến động tin cậy 95% - Vùng bóng mờ xanh)     │ │
│ │  50 ┤                       /\              /     \---                                                     │ │
│ │  40 ┤        /\            /  \       -----*-------*---* (Đường dự báo AI tương lai 14 ngày)               │ │
│ │  30 ┤  /\   /  \     /\   /    \-----/     \       /                                                       │ │
│ │  20 ┤ /  \-/    \---/  \-/                  \-----/                                                        │ │
│ │  10 ┤ (Dữ liệu bán thực tế 30 ngày quá khứ)                                                                │ │
│ │   0 └───────────────────────────────────────┬────────────────────────────────────────── Ngày               │ │
│ │     25/08      01/09      05/09   08/09 (Hiện tại)     15/09      22/09                                    │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ THẺ GIẢI TRÌNH MÔ HÌNH:                                                                                        │
│ • Thuật toán áp dụng: Holt-Winters Additive Seasonality (Học chu kỳ cuối tuần và xu hướng tăng trưởng)       │
│ • Chỉ số sai số kiểm định: WAPE = 12.4% (Rất tốt, < 40%)  │  MAE = 2.8 hộp                                     │
│ • Trạng thái: ✅ Mô hình AI hoạt động chuẩn xác (Không cần kích hoạt Fallback SMA-7).                          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BẢNG TỔNG HỢP TOÀN BỘ DANH MỤC:                                                                                │
│ [Mã SKU | Tên Sản Phẩm | Tổng Cầu Dự Báo | TB Ngày | WAPE (%) | Thuật Toán | Trạng Thái | Thao Tác]            │
│ • Hàng Cold Start (< 14N): Gắn nhãn màu cam [COLD_START] kèm nút [Nhập Định Mức Ngày] trực tiếp tại dòng.      │
│ • Hàng Fallback: Gắn nhãn màu vàng [FALLBACK_SMA7] giải thích do WAPE > 40%.                                   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.7. Màn Hình 7: Đánh Giá & Xếp Hạng Nhà Cung Cấp (`UC-009`, `UC-017`)
* **Mục tiêu:** Hiển thị bảng xếp hạng đối tác dựa trên 4 tiêu chí thành phần: Đơn giá cạnh tranh, Đúng hạn & Đủ hàng (OTIF), Chất lượng sản phẩm, và Tốc độ giao hàng (Lead time).
* **Đường dẫn:** `/suppliers/evaluations`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🏆 Bảng Xếp Hạng & Đánh Giá Nhà Cung Cấp (UC-009)]                              [⚙️ Cấu Hình Trọng Số (Admin)]│
│ Tổng hợp hiệu suất dựa trên 10 lần giao hàng gần nhất được ghi nhận từ kho thực tế                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ THANH TỶ TRỌNG ĐÁNG GIÁ ĐANG ÁP DỤNG:                                                                          │
│ [ Giá Cả (Price): 30% ]  [ Đúng Hạn OTIF: 35% ]  [ Chất Lượng: 20% ]  [ Thời Gian Giao Leadtime: 15% ] (Tổng=100%)│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BẢNG XẾP HẠNG ĐỐI TÁC CUNG ỨNG:                                                                                │
│ ┌────┬────────────────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬────────────┬───────────┐ │
│ │Hạng│Tên Nhà Cung Cấp        │SốLầnGiao│Điểm Giá  │Điểm OTIF │Điểm Chất │Điểm Lead │Tổng Điểm   │Xem Chi    │ │
│ │    │                        │Đánh Giá │(S_price) │(S_otif)  │Lượng     │Time      │DSS (Score) │Tiết 10 Lần│ │
│ ├────┼────────────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼────────────┼───────────┤ │
│ │🥇1 │Cty CP Sữa Vinamilk     │ 10 lần  │   92.0   │   98.0   │   95.0   │   96.0   │   95.4 /100│[Lịch Sử]  │ │
│ │🥈2 │Cty TNHH TH True Milk   │  8 lần  │   88.0   │   92.0   │   96.0   │   90.0   │   91.2 /100│[Lịch Sử]  │ │
│ │🥉3 │Công ty Masan Consumer  │ 10 lần  │   95.0   │   80.0   │   90.0   │   85.0   │   87.3 /100│[Lịch Sử]  │ │
│ └────┴────────────────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴────────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Drawer Lịch Sử 10 Lần Giao Hàng Gần Nhất (Supplier Delivery History Drawer):**
  * Hiển thị bảng chi tiết: Mã PO, Ngày hẹn, Ngày thực giao, Số lượng đặt, Số lượng giao, Số lượng lỗi, Đạt OTIF hay không và Ghi chú thực tế.

---

### 4.8. Màn Hình 8: Nạp Dữ Liệu Bán Hàng & Tồn Kho (`UC-003`)
* **Mục tiêu:** Tiếp nhận dữ liệu lịch sử bán hàng và số liệu kiểm kê thực tế qua file Excel/CSV hoặc form nhập nhanh, kèm cơ chế kiểm tra dữ liệu nghiêm ngặt.
* **Đường dẫn:** `/data-import`

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [📤 Nạp Dữ Liệu Bán Hàng & Kiểm Kê Kho (UC-003)]                                                               │
│ Cập nhật chuỗi thời gian tiêu thụ phục vụ huấn luyện AI và đồng bộ số lượng tồn kho khả dụng                   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 1: CHỌN LOẠI DỮ LIỆU CẦN NẠP                                                                              │
│ [ (•) Lịch Sử Bán Hàng Hàng Ngày (Sales History) ]      [ ( ) Số Lượng Kiểm Kê Kho Thực Tế (Stock Inventory) ] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 2: KHU VỰC TẢI LÊN HOẶC KÉO THẢ TỆP TIN                                                                   │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                  📁 [Biểu tượng Excel / CSV nổi bật]                                        │ │
│ │                        Kéo và thả tệp tin dữ liệu (.xlsx hoặc .csv) vào đây                                │ │
│ │                               hoặc [Nhấp vào đây để chọn tệp từ máy tính]                                   │ │
│ │                                                                                                            │ │
│ │   [📥 Tải File Mẫu Excel Chuẩn Lịch Sử Bán Hàng]        [📥 Tải File Mẫu Kiểm Kê Tồn Kho Thực Tế]          │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ Tùy chọn: [☑] Ghi đè dữ liệu trùng lặp nếu có cùng mã SKU và ngày giao dịch                                    │
│ [⚡ Bắt Đầu Tải Lên & Xác Thực Dữ Liệu]                                                                         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KẾT QUẢ XÁC THỰC DỮ LIỆU (VALIDATION SUMMARY & ERROR REPORT):                                                  │
│ • Trạng thái: ✅ Đã kiểm tra 1.250 dòng dữ liệu — 1.248 dòng hợp lệ, 2 dòng cảnh báo lỗi.                     │
│ ┌──────┬──────────┬──────────────────────┬─────────────────────────────────────────────────────────────────┐ │
│ │Dòng  │Mã SKU    │Giá Trị Sai Phạm      │Nguyên Nhân Lỗi                                                  │ │
│ ├──────┼──────────┼──────────────────────┼─────────────────────────────────────────────────────────────────┤ │
│ │Dòng14│UNKNOWN-99│Không tìm thấy SKU    │Mã SKU chưa tồn tại trong danh mục sản phẩm (Master Data).       │ │
│ │Dòng85│MILK-180  │Số lượng bán = -5     │Số lượng bán hàng không được phép mang giá trị âm.               │ │
│ └──────┴──────────┴──────────────────────┴─────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Quy Chuẩn Design System, Màu Sắc & Tokens (Design Tokens Specification)

Để đảm bảo tính nhất quán trên toàn bộ ứng dụng, các bảng mã màu và quy chuẩn trực quan được chuẩn hóa như sau:

### 5.1. Bảng Màu 5 Cấp Độ Rủi Ro Tồn Kho (Risk Level Palette - Bắt Buộc Chuẩn Hóa)

| Mã Cấp Độ Rủi Ro | Ý Nghĩa Nghiệp Vụ | Tailwind Background | Tailwind Text | Mã Màu Hex | Trực Quan Hóa |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`OUT_OF_STOCK`** | Đã hết sạch hàng trên kệ ($\text{On-Hand} \le 0$) | `bg-red-100 border-red-300` | `text-red-800` | `#DC2626` | 🔴 Đỏ sẫm |
| **`CRITICAL`** | Nguy cấp, thâm hụt tồn an toàn ($\text{IP} < \text{SS}$) | `bg-orange-100 border-orange-300`| `text-orange-800` | `#EA580C` | 🟠 Đỏ cam |
| **`WARNING`** | Chạm điểm đặt hàng lại ($\text{SS} \le \text{IP} \le \text{ROP}$) | `bg-amber-100 border-amber-300` | `text-amber-800` | `#D97706` | 🟡 Vàng hổ phách |
| **`NORMAL`** | Tồn kho nằm trong vùng an toàn ($\text{ROP} < \text{IP} \le \text{Max}$) | `bg-emerald-100 border-emerald-300`| `text-emerald-800` | `#059669` | 🟢 Xanh ngọc lục bảo |
| **`OVERSTOCK`** | Tồn dư quá mức, ứ đọng vốn ($\text{IP} > \text{Max Stock}$) | `bg-purple-100 border-purple-300`| `text-purple-800` | `#7C3AED` | 🟣 Tím thẫm |
| **`DEAD_STOCK`** | Hàng tồn bất động (Không bán được trong 30 ngày) | `bg-slate-200 border-slate-400` | `text-slate-800` | `#475569` | ⚫ Xám chì |

### 5.2. Bảng Trạng Thái Vòng Đời Đơn Mua Hàng (Purchase Order Status)

| Trạng Thái PO | Ý Nghĩa Vận Hành | Màu Sắc | Hành Vi Ràng Buộc |
| :--- | :--- | :--- | :--- |
| **`DRAFT`** | Đơn nháp đang soạn thảo | Màu xám tro (`bg-slate-100 text-slate-700`) | Được phép sửa SKU, số lượng, đổi NCC; chưa tăng On-Order. |
| **`ORDERED`** | Đã chốt và gửi nhà cung cấp | Màu xanh da trời (`bg-sky-100 text-sky-800`) | Khóa đơn không cho sửa; tự động tăng tồn kho $\text{On-Order}$. |
| **`RECEIVED`** | Đã nhận hàng thực tế vào kho | Màu xanh lá cây (`bg-emerald-100 text-emerald-800`) | Tăng On-Hand, trừ On-Order, hoàn tất PO, ghi log OTIF. |
| **`CANCELLED`** | Đã hủy đơn hàng | Màu đỏ gạch (`bg-rose-100 text-rose-800`) | Bắt buộc nhập lý do hủy; tự động giải phóng lượng On-Order về 0. |

### 5.3. Bảng Màu Ma Trận 9 Ô ABC - XYZ (Matrix Cells)

* **Nhóm Chủ Lực Hàng Đầu (`AX`):** Xanh lá đậm (`#15803D`) — Ưu tiên cao nhất, tối ưu tự động.
* **Nhóm Biến Động Trung Bình (`AY`, `BX`):** Xanh lá nhạt / Vàng chanh (`#65A30D` / `#CA8A04`).
* **Nhóm Tiềm Ẩn Rủi Ro Cao (`AZ`, `BY`):** Vàng cam / Cam cháy (`#D97706` / `#EA580C`).
* **Nhóm Khó Dự Báo & Bán Chậm (`BZ`, `CX`, `CY`):** Xám xanh (`#64748B`).
* **Nhóm Rủi Ro Đọng Vốn (`CZ`):** Tím xám / Đỏ nâu (`#991B1B` / `#581C87`) — Cân nhắc thanh lý, ngừng kinh doanh.

---

## 6. Lộ Trình Nâng Cấp Giao Diện Khớp Chuẩn Nghiệp Vụ (Execution Roadmap)

Nhằm tối ưu hóa trải nghiệm người dùng và hoàn thiện hệ thống chuẩn mực theo đặc tả, lộ trình triển khai được chia thành 3 giai đoạn tinh gọn:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3 GIAI ĐOẠN NÂNG CẤP GIAO DIỆN (UI ROADMAP)            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 1: HOÀN THIỆN TRUNG TÂM RA QUYẾT ĐỊNH MUA HÀNG (ƯU TIÊN CAO NHẤT) │
│ • Tái cấu trúc RecommendationsPage: Thêm bộ chọn Horizon 7/14/30 ngày.      │
│ • Xây dựng Hộp thoại Gom Đơn theo NCC (Batch Grouping Modal) chống gộp nhầm.│
│ • Bổ sung tính năng sửa số lượng Q_edit và Dropdown đổi NCC ngay tại dòng.  │
│ • Nâng cấp Drawer Minh Bạch Lý Giải (Explainable Drawer) 3 câu cô đọng.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 2: THỰC THI GIAO DỊCH & BỔ SUNG KHÔNG GIAN NHẬN HÀNG              │
│ • Xây dựng giao diện Ghi Nhận Nhận Hàng (/goods-receipt) chuyên trách.       │
│ • Tích hợp nút tiện ích "Nhận đủ 100% không lỗi" và xem trước chỉ số OTIF.  │
│ • Bổ sung mẫu in Phiếu Đơn Mua Hàng (PO Printable Sheet) và Phiếu Nhập Kho.│
│ • Nâng cấp InventoryTable với thanh đo mức tồn kho (Segmented Visual Gauge).│
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 3: HOÀN THIỆN ĐỒ THỊ AI & ĐÁNH GIÁ ĐỐI TÁC                         │
│ • Cải tiến biểu đồ chuỗi thời gian ECharts: Làm rõ dải mây tin cậy 95%.     │
│ • Gắn cờ trạng thái Cold Start và nút nhập định mức trực tiếp trong bảng.   │
│ • Xây dựng Drawer xem chi tiết lịch sử 10 lần giao hàng của từng đối tác.   │
│ • Đồng bộ toàn diện hệ thống Toast, Actionable Empty States và Breadcrumb.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Kết Luận & Cam Kết Kiến Trúc

Bản đặc tả thiết kế UI/UX này là kim chỉ nam chính thức kết nối chặt chẽ giữa **Tài liệu Yêu Cầu Nghiệp Vụ (`docs/01-business/` $\rightarrow$ `docs/03-use-cases/`)** và **Mã Nguồn Frontend (`frontend/src/`)**.

Mọi thay đổi trên giao diện từ thời điểm này bắt buộc phải:
1. Phục vụ trực tiếp việc ra quyết định của con người (Human-in-the-loop).
2. Minh bạch hóa căn cứ số liệu của AI (Explainable Decision).
3. Tuân thủ 100% các quy tắc bất biến nghiệp vụ (`BR-001` $\rightarrow$ `BR-026`) và tiêu chuẩn giao tiếp Clean Architecture của dự án.
