-- =============================================================================
-- PHYSICAL SCHEMA DDL: HỆ THỐNG HỖ TRỢ RA QUYẾT ĐỊNH MUA HÀNG TÍCH HỢP AI
-- Hệ quản trị cơ sở dữ liệu mục tiêu: PostgreSQL 14+
-- Tài liệu tham chiếu: 01-business, 02-requirements, 03-use-cases, 04-data-model
-- =============================================================================

-- 1. KHỞI TẠO TIỆN ÍCH MỞ RỘNG (EXTENSIONS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU LIỆT KÊ (ENUM TYPES)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('OUT_OF_STOCK', 'CRITICAL', 'WARNING', 'NORMAL', 'OVERSTOCK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maturity_tier AS ENUM ('COLD_START', 'BASIC_FORECAST', 'AI_READY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE po_status AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE abc_class AS ENUM ('A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE xyz_class AS ENUM ('X', 'Y', 'Z');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE abc_xyz_segment AS ENUM ('AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE algorithm_type AS ENUM ('AI_MODEL', 'FALLBACK_SMA7', 'BASIC_SMA7', 'COLD_START_ESTIMATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_type AS ENUM ('SALES_HISTORY', 'INVENTORY_SNAPSHOT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_status AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE supplier_status_tag AS ENUM ('NEW_SUPPLIER', 'ACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recommendation_status AS ENUM ('PENDING', 'ORDERED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 3. HÀM DÙNG CHUNG CẬP NHẬT THỜI GIAN (UPDATED_AT TRIGGER FUNCTION)
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. BẢNG DỮ LIỆU MIỀN 5: SECURITY & IDENTITY
-- =============================================================================

-- Bảng 1: users (Tài khoản người dùng & phân quyền)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =============================================================================
-- 5. BẢNG DỮ LIỆU MIỀN 1: MASTER DATA (DANH MỤC CỐT LÕI)
-- =============================================================================

-- Bảng 2: products (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    sku VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_price DECIMAL(15,2) NOT NULL,
    selling_price DECIMAL(15,2) NOT NULL,
    default_lead_time INTEGER NOT NULL DEFAULT 1,
    min_safety_stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_cost_price_positive CHECK (cost_price > 0),
    CONSTRAINT check_selling_price_positive CHECK (selling_price > 0),
    CONSTRAINT check_default_lead_time_min CHECK (default_lead_time >= 1),
    CONSTRAINT check_min_safety_stock_non_neg CHECK (min_safety_stock >= 0)
);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Bảng 3: suppliers (Danh mục nhà cung cấp)
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    status_tag supplier_status_tag NOT NULL DEFAULT 'NEW_SUPPLIER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_suppliers
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Bảng 4: product_suppliers (Bảng giá và điều kiện cung ứng N:M)
CREATE TABLE IF NOT EXISTS product_suppliers (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_price DECIMAL(15,2) NOT NULL,
    moq INTEGER NOT NULL DEFAULT 1,
    pack_size INTEGER NOT NULL DEFAULT 1,
    committed_lead_time INTEGER NOT NULL DEFAULT 1,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_purchase_price_positive CHECK (purchase_price > 0),
    CONSTRAINT check_moq_min CHECK (moq >= 1),
    CONSTRAINT check_pack_size_min CHECK (pack_size >= 1),
    CONSTRAINT check_committed_lead_time_min CHECK (committed_lead_time >= 1),
    CONSTRAINT unique_product_supplier UNIQUE (product_sku, supplier_id)
);

CREATE TRIGGER set_timestamp_product_suppliers
BEFORE UPDATE ON product_suppliers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =============================================================================
-- 6. BẢNG DỮ LIỆU MIỀN 2: INVENTORY & SALES INGESTION
-- =============================================================================

-- Bảng 5: inventory (Tồn kho và các chỉ số an toàn DSS)
CREATE TABLE IF NOT EXISTS inventory (
    product_sku VARCHAR(50) PRIMARY KEY REFERENCES products(sku) ON DELETE CASCADE,
    on_hand INTEGER NOT NULL DEFAULT 0,
    on_order INTEGER NOT NULL DEFAULT 0,
    calculated_ip INTEGER NOT NULL DEFAULT 0,
    safety_stock INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 0,
    days_of_supply DECIMAL(7,1) NOT NULL DEFAULT 0.0,
    risk_level risk_level NOT NULL DEFAULT 'NORMAL',
    is_dead_stock BOOLEAN NOT NULL DEFAULT FALSE,
    last_stocktake_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_on_hand_non_negative CHECK (on_hand >= 0),
    CONSTRAINT check_on_order_non_negative CHECK (on_order >= 0),
    CONSTRAINT check_safety_stock_non_negative CHECK (safety_stock >= 0),
    CONSTRAINT check_reorder_point_non_negative CHECK (reorder_point >= 0),
    CONSTRAINT check_max_stock_non_negative CHECK (max_stock >= 0),
    CONSTRAINT check_days_of_supply_non_negative CHECK (days_of_supply >= 0)
);

CREATE TRIGGER set_timestamp_inventory
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Trigger tự động cập nhật vị trí tồn kho IP = On-Hand + On-Order (BR-001)
CREATE OR REPLACE FUNCTION trigger_calculate_inventory_ip()
RETURNS TRIGGER AS $$
BEGIN
    NEW.calculated_ip = NEW.on_hand + NEW.on_order;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_inventory_ip
BEFORE INSERT OR UPDATE ON inventory
FOR EACH ROW
EXECUTE PROCEDURE trigger_calculate_inventory_ip();

-- Bảng 6: inventory_snapshots (Nhật ký điều chỉnh kiểm kê tồn kho)
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    previous_on_hand INTEGER NOT NULL,
    new_on_hand INTEGER NOT NULL,
    adjustment_quantity INTEGER NOT NULL,
    reason TEXT,
    adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_previous_on_hand_non_negative CHECK (previous_on_hand >= 0),
    CONSTRAINT check_new_on_hand_non_negative CHECK (new_on_hand >= 0)
);

-- Bảng 7: data_import_logs (Nhật ký nạp tệp Excel/CSV)
CREATE TABLE IF NOT EXISTS data_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type import_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    status import_status NOT NULL,
    error_details JSONB,
    imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_file_size_positive CHECK (file_size_bytes > 0),
    CONSTRAINT check_total_rows_non_negative CHECK (total_rows >= 0),
    CONSTRAINT check_successful_rows_non_negative CHECK (successful_rows >= 0),
    CONSTRAINT check_failed_rows_non_negative CHECK (failed_rows >= 0)
);

-- Bảng 8: sales_history (Chuỗi thời gian bán hàng theo ngày)
CREATE TABLE IF NOT EXISTS sales_history (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    sale_date DATE NOT NULL,
    quantity_sold INTEGER NOT NULL,
    revenue DECIMAL(15,2) NOT NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'IMPORT_EXCEL',
    import_batch_id UUID REFERENCES data_import_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity_sold_non_negative CHECK (quantity_sold >= 0),
    CONSTRAINT check_revenue_non_negative CHECK (revenue >= 0),
    CONSTRAINT unique_product_sale_date UNIQUE (product_sku, sale_date)
);

-- =============================================================================
-- 7. BẢNG DỮ LIỆU MIỀN 3: DEMAND FORECASTING & DSS ANALYTICS
-- =============================================================================

-- Bảng 9: cold_start_inputs (Lượng bán dự kiến cho sản phẩm mới)
CREATE TABLE IF NOT EXISTS cold_start_inputs (
    product_sku VARCHAR(50) PRIMARY KEY REFERENCES products(sku) ON DELETE CASCADE,
    history_days_count INTEGER NOT NULL DEFAULT 0,
    expected_daily_sales INTEGER NOT NULL,
    notes TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_history_days_non_negative CHECK (history_days_count >= 0),
    CONSTRAINT check_expected_daily_sales_non_negative CHECK (expected_daily_sales >= 0)
);

CREATE TRIGGER set_timestamp_cold_start_inputs
BEFORE UPDATE ON cold_start_inputs
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Bảng 10: demand_forecasts (Kết quả dự báo nhu cầu chuỗi thời gian)
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    forecast_date DATE NOT NULL DEFAULT CURRENT_DATE,
    horizon_days INTEGER NOT NULL DEFAULT 14,
    forecasted_demand INTEGER NOT NULL,
    daily_avg_demand DECIMAL(10,2) NOT NULL,
    wape DECIMAL(5,2),
    mae DECIMAL(10,2),
    algorithm_used algorithm_type NOT NULL,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    forecast_points JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_horizon_days_valid CHECK (horizon_days IN (7, 14, 30)),
    CONSTRAINT check_forecasted_demand_non_negative CHECK (forecasted_demand >= 0),
    CONSTRAINT check_daily_avg_demand_non_negative CHECK (daily_avg_demand >= 0),
    CONSTRAINT check_wape_non_negative CHECK (wape IS NULL OR wape >= 0),
    CONSTRAINT check_mae_non_negative CHECK (mae IS NULL OR mae >= 0),
    CONSTRAINT unique_sku_forecast_horizon UNIQUE (product_sku, forecast_date, horizon_days)
);

-- Bảng 11: abc_xyz_analysis (Phân loại ma trận ABC-XYZ 30 ngày)
CREATE TABLE IF NOT EXISTS abc_xyz_analysis (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    window_days INTEGER NOT NULL DEFAULT 30,
    total_revenue DECIMAL(15,2) NOT NULL,
    revenue_pct DECIMAL(5,2) NOT NULL,
    cumulative_revenue_pct DECIMAL(5,2) NOT NULL,
    abc_class abc_class NOT NULL,
    daily_sales_mean DECIMAL(10,2) NOT NULL,
    daily_sales_std_dev DECIMAL(10,2) NOT NULL,
    coefficient_of_variation DECIMAL(7,3) NOT NULL,
    xyz_class xyz_class NOT NULL,
    abc_xyz_segment abc_xyz_segment NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_window_days_30 CHECK (window_days = 30),
    CONSTRAINT check_total_revenue_non_negative CHECK (total_revenue >= 0),
    CONSTRAINT check_revenue_pct_range CHECK (revenue_pct >= 0 AND revenue_pct <= 100),
    CONSTRAINT check_cumulative_revenue_pct_range CHECK (cumulative_revenue_pct >= 0 AND cumulative_revenue_pct <= 100),
    CONSTRAINT check_daily_sales_mean_non_negative CHECK (daily_sales_mean >= 0),
    CONSTRAINT check_daily_sales_std_dev_non_negative CHECK (daily_sales_std_dev >= 0),
    CONSTRAINT check_cv_non_negative CHECK (coefficient_of_variation >= 0),
    CONSTRAINT unique_sku_analysis_date UNIQUE (product_sku, analysis_date)
);

-- =============================================================================
-- 8. BẢNG DỮ LIỆU MIỀN 4: PROCUREMENT & EVALUATION
-- =============================================================================

-- Bảng 12: supplier_evaluation_weights (Cấu hình trọng số đánh giá NCC)
CREATE TABLE IF NOT EXISTS supplier_evaluation_weights (
    id INTEGER PRIMARY KEY DEFAULT 1,
    weight_otif DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    weight_quality DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    weight_price DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    weight_leadtime DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_single_row_config CHECK (id = 1),
    CONSTRAINT check_weight_otif_non_negative CHECK (weight_otif >= 0),
    CONSTRAINT check_weight_quality_non_negative CHECK (weight_quality >= 0),
    CONSTRAINT check_weight_price_non_negative CHECK (weight_price >= 0),
    CONSTRAINT check_weight_leadtime_non_negative CHECK (weight_leadtime >= 0),
    CONSTRAINT check_sum_100 CHECK ((weight_otif + weight_quality + weight_price + weight_leadtime) = 100.00)
);

CREATE TRIGGER set_timestamp_weights
BEFORE UPDATE ON supplier_evaluation_weights
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Bảng 13: supplier_evaluations (Đánh giá hiệu suất NCC 10 lần gần nhất)
CREATE TABLE IF NOT EXISTS supplier_evaluations (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_count_analyzed INTEGER NOT NULL DEFAULT 0,
    price_score DECIMAL(5,2) NOT NULL,
    otif_score DECIMAL(5,2) NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    lead_time_score DECIMAL(5,2) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    rank INTEGER,
    is_new_supplier BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_delivery_count_non_negative CHECK (delivery_count_analyzed >= 0),
    CONSTRAINT check_price_score_range CHECK (price_score >= 0 AND price_score <= 100),
    CONSTRAINT check_otif_score_range CHECK (otif_score >= 0 AND otif_score <= 100),
    CONSTRAINT check_quality_score_range CHECK (quality_score >= 0 AND quality_score <= 100),
    CONSTRAINT check_lead_time_score_range CHECK (lead_time_score >= 0 AND lead_time_score <= 100),
    CONSTRAINT check_total_score_range CHECK (total_score >= 0 AND total_score <= 100),
    CONSTRAINT check_rank_min CHECK (rank IS NULL OR rank >= 1),
    CONSTRAINT unique_supplier_evaluation_date UNIQUE (supplier_id, evaluation_date)
);

-- Bảng 14: purchase_recommendations (Khuyến nghị mua hàng thông minh)
CREATE TABLE IF NOT EXISTS purchase_recommendations (
    id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    recommended_supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    horizon_days INTEGER NOT NULL DEFAULT 14,
    on_hand_at_eval INTEGER NOT NULL,
    on_order_at_eval INTEGER NOT NULL,
    forecasted_demand INTEGER NOT NULL,
    safety_stock INTEGER NOT NULL,
    raw_shortage INTEGER NOT NULL,
    suggested_quantity INTEGER NOT NULL,
    suggested_order_date DATE NOT NULL,
    estimated_unit_price DECIMAL(15,2),
    estimated_total_cost DECIMAL(15,2),
    urgency_level risk_level NOT NULL,
    explanation_summary TEXT NOT NULL,
    explanation_factors JSONB NOT NULL,
    status recommendation_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rec_horizon_days CHECK (horizon_days IN (7, 14, 30)),
    CONSTRAINT check_suggested_quantity_non_negative CHECK (suggested_quantity >= 0),
    CONSTRAINT check_estimated_unit_price_positive CHECK (estimated_unit_price IS NULL OR estimated_unit_price > 0),
    CONSTRAINT check_estimated_total_cost_non_negative CHECK (estimated_total_cost IS NULL OR estimated_total_cost >= 0)
);

-- Bảng 15: purchase_orders (Đơn mua hàng Master)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status po_status NOT NULL DEFAULT 'DRAFT',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    promised_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_total_amount_non_negative CHECK (total_amount >= 0)
);

CREATE TRIGGER set_timestamp_purchase_orders
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Bảng 16: purchase_order_items (Chi tiết mặt hàng trong đơn PO)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_sku VARCHAR(50) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    ordered_quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    delivered_quantity INTEGER DEFAULT 0,
    defective_quantity INTEGER DEFAULT 0,
    accepted_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_ordered_quantity_positive CHECK (ordered_quantity > 0),
    CONSTRAINT check_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT check_total_price_positive CHECK (total_price > 0),
    CONSTRAINT check_delivered_quantity_non_negative CHECK (delivered_quantity >= 0),
    CONSTRAINT check_defective_quantity_non_negative CHECK (defective_quantity >= 0),
    CONSTRAINT check_accepted_quantity_non_negative CHECK (accepted_quantity >= 0),
    CONSTRAINT check_defective_le_delivered CHECK (defective_quantity <= delivered_quantity),
    CONSTRAINT unique_order_product UNIQUE (order_id, product_sku)
);

-- Bảng 17: delivery_history (Nhật ký nhận hàng & OTIF)
CREATE TABLE IF NOT EXISTS delivery_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    promised_date DATE NOT NULL,
    actual_delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_ordered_quantity INTEGER NOT NULL,
    total_delivered_quantity INTEGER NOT NULL,
    total_defective_quantity INTEGER NOT NULL DEFAULT 0,
    total_accepted_quantity INTEGER NOT NULL,
    lead_time_days INTEGER NOT NULL,
    is_on_time BOOLEAN NOT NULL,
    is_in_full BOOLEAN NOT NULL,
    is_otif BOOLEAN NOT NULL,
    notes TEXT,
    received_by UUID NOT NULL REFERENCES users(id),
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_total_ordered_positive CHECK (total_ordered_quantity > 0),
    CONSTRAINT check_total_delivered_non_negative CHECK (total_delivered_quantity >= 0),
    CONSTRAINT check_total_defective_non_negative CHECK (total_defective_quantity >= 0),
    CONSTRAINT check_total_accepted_non_negative CHECK (total_accepted_quantity >= 0),
    CONSTRAINT check_lead_time_days_non_negative CHECK (lead_time_days >= 0)
);

-- =============================================================================
-- 9. BẢNG DỮ LIỆU MIỀN 5 (TIẾP TỤC): AUDIT TRAIL
-- =============================================================================

-- Bảng 18: audit_logs (Nhật ký kiểm toán an ninh hệ thống)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 10. THIẾT LẬP CHỈ MỤC TỐI ƯU HIỆU NĂNG (PERFORMANCE INDEXES)
-- =============================================================================

-- Chỉ mục tìm kiếm sản phẩm và lọc theo trạng thái/ngành hàng
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Chỉ mục nhà cung cấp
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_status_tag ON suppliers(status_tag);

-- Chỉ mục bảng giá quan hệ NCC - Sản phẩm
CREATE INDEX IF NOT EXISTS idx_product_suppliers_sku ON product_suppliers(product_sku);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers(supplier_id);

-- Chỉ mục tồn kho và cảnh báo rủi ro cao tần
CREATE INDEX IF NOT EXISTS idx_inventory_risk_level ON inventory(risk_level);
CREATE INDEX IF NOT EXISTS idx_inventory_is_dead_stock ON inventory(is_dead_stock);

-- Chỉ mục chuỗi thời gian bán hàng (tối ưu cho truy vấn huấn luyện dự báo AI & ABC)
CREATE INDEX IF NOT EXISTS idx_sales_history_sku_date ON sales_history(product_sku, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(sale_date);

-- Chỉ mục kết quả dự báo nhu cầu
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_sku_date ON demand_forecasts(product_sku, forecast_date DESC);

-- Chỉ mục phân loại ma trận ABC-XYZ
CREATE INDEX IF NOT EXISTS idx_abc_xyz_analysis_date_seg ON abc_xyz_analysis(analysis_date DESC, abc_xyz_segment);

-- Chỉ mục đánh giá nhà cung cấp
CREATE INDEX IF NOT EXISTS idx_supplier_eval_supplier_date ON supplier_evaluations(supplier_id, evaluation_date DESC);

-- Chỉ mục khuyến nghị mua hàng thông minh
CREATE INDEX IF NOT EXISTS idx_purchase_recommendations_status ON purchase_recommendations(status, urgency_level);

-- Chỉ mục đơn mua hàng PO
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(order_id);

-- Chỉ mục lịch sử giao hàng phục vụ tính điểm NCC trên 10 lần gần nhất
CREATE INDEX IF NOT EXISTS idx_delivery_history_supplier_date ON delivery_history(supplier_id, actual_delivery_date DESC);

-- Chỉ mục kiểm toán
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);

-- =============================================================================
-- 11. KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATA MẪU CHUẨN)
-- =============================================================================

-- Khởi tạo tài khoản Quản trị viên mặc định (Mật khẩu mặc định: Admin@123)
INSERT INTO users (id, username, password_hash, full_name, email, role, is_active, must_change_password)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$7BBUnxxzBS3XR/m0jKNXuO0pp08uDuNWdeV0bKUfL2WBkbyRCa/mu', -- Bcrypt hash cho Admin@123
    'Quản Trị Viên Hệ Thống',
    'admin@dss-purchase.local',
    'ADMIN',
    TRUE,
    FALSE
) ON CONFLICT (username) DO NOTHING;

-- Khởi tạo bộ trọng số đánh giá Nhà cung cấp mặc định chuẩn theo BR-013
INSERT INTO supplier_evaluation_weights (id, weight_otif, weight_quality, weight_price, weight_leadtime, updated_by)
VALUES (
    1,
    35.00,
    30.00,
    20.00,
    15.00,
    'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET
    weight_otif = EXCLUDED.weight_otif,
    weight_quality = EXCLUDED.weight_quality,
    weight_price = EXCLUDED.weight_price,
    weight_leadtime = EXCLUDED.weight_leadtime;

-- =============================================================================
-- KẾT THÚC KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU
-- =============================================================================
