-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "risk_level" AS ENUM ('OUT_OF_STOCK', 'CRITICAL', 'WARNING', 'NORMAL', 'OVERSTOCK');

-- CreateEnum
CREATE TYPE "maturity_tier" AS ENUM ('COLD_START', 'BASIC_FORECAST', 'AI_READY');

-- CreateEnum
CREATE TYPE "po_status" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "abc_class" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "xyz_class" AS ENUM ('X', 'Y', 'Z');

-- CreateEnum
CREATE TYPE "abc_xyz_segment" AS ENUM ('AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ');

-- CreateEnum
CREATE TYPE "algorithm_type" AS ENUM ('AI_MODEL', 'FALLBACK_SMA7', 'BASIC_SMA7', 'COLD_START_ESTIMATE');

-- CreateEnum
CREATE TYPE "import_type" AS ENUM ('SALES_HISTORY', 'INVENTORY_SNAPSHOT');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "supplier_status_tag" AS ENUM ('NEW_SUPPLIER', 'ACTIVE');

-- CreateEnum
CREATE TYPE "recommendation_status" AS ENUM ('PENDING', 'ORDERED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "cost_price" DECIMAL(15,2) NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "default_lead_time" INTEGER NOT NULL DEFAULT 1,
    "min_safety_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("sku")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "address" TEXT,
    "status_tag" "supplier_status_tag" NOT NULL DEFAULT 'NEW_SUPPLIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "pack_size" INTEGER NOT NULL DEFAULT 1,
    "committed_lead_time" INTEGER NOT NULL DEFAULT 1,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "product_sku" VARCHAR(50) NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "on_order" INTEGER NOT NULL DEFAULT 0,
    "calculated_ip" INTEGER NOT NULL DEFAULT 0,
    "safety_stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER NOT NULL DEFAULT 0,
    "days_of_supply" DECIMAL(7,1) NOT NULL DEFAULT 0.0,
    "risk_level" "risk_level" NOT NULL DEFAULT 'NORMAL',
    "is_dead_stock" BOOLEAN NOT NULL DEFAULT false,
    "last_stocktake_date" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("product_sku")
);

-- CreateTable
CREATE TABLE "inventory_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "snapshot_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_on_hand" INTEGER NOT NULL,
    "new_on_hand" INTEGER NOT NULL,
    "adjustment_quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "adjusted_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_import_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "import_type" "import_type" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "status" "import_status" NOT NULL,
    "error_details" JSONB,
    "imported_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_history" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "sale_date" DATE NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'IMPORT_EXCEL',
    "import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cold_start_inputs" (
    "product_sku" VARCHAR(50) NOT NULL,
    "history_days_count" INTEGER NOT NULL DEFAULT 0,
    "expected_daily_sales" INTEGER NOT NULL,
    "notes" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cold_start_inputs_pkey" PRIMARY KEY ("product_sku")
);

-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "forecast_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horizon_days" INTEGER NOT NULL DEFAULT 14,
    "forecasted_demand" INTEGER NOT NULL,
    "daily_avg_demand" DECIMAL(10,2) NOT NULL,
    "wape" DECIMAL(5,2),
    "mae" DECIMAL(10,2),
    "algorithm_used" "algorithm_type" NOT NULL,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "forecast_points" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abc_xyz_analysis" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "analysis_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "window_days" INTEGER NOT NULL DEFAULT 30,
    "total_revenue" DECIMAL(15,2) NOT NULL,
    "revenue_pct" DECIMAL(5,2) NOT NULL,
    "cumulative_revenue_pct" DECIMAL(5,2) NOT NULL,
    "abc_class" "abc_class" NOT NULL,
    "daily_sales_mean" DECIMAL(10,2) NOT NULL,
    "daily_sales_std_dev" DECIMAL(10,2) NOT NULL,
    "coefficient_of_variation" DECIMAL(7,3) NOT NULL,
    "xyz_class" "xyz_class" NOT NULL,
    "abc_xyz_segment" "abc_xyz_segment" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abc_xyz_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_evaluation_weights" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "weight_otif" DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    "weight_quality" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "weight_price" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "weight_leadtime" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_evaluation_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_evaluations" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "evaluation_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_count_analyzed" INTEGER NOT NULL DEFAULT 0,
    "price_score" DECIMAL(5,2) NOT NULL,
    "otif_score" DECIMAL(5,2) NOT NULL,
    "quality_score" DECIMAL(5,2) NOT NULL,
    "lead_time_score" DECIMAL(5,2) NOT NULL,
    "total_score" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER,
    "is_new_supplier" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_recommendations" (
    "id" BIGSERIAL NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "recommended_supplier_id" BIGINT,
    "horizon_days" INTEGER NOT NULL DEFAULT 14,
    "on_hand_at_eval" INTEGER NOT NULL,
    "on_order_at_eval" INTEGER NOT NULL,
    "forecasted_demand" INTEGER NOT NULL,
    "safety_stock" INTEGER NOT NULL,
    "raw_shortage" INTEGER NOT NULL,
    "suggested_quantity" INTEGER NOT NULL,
    "suggested_order_date" DATE NOT NULL,
    "estimated_unit_price" DECIMAL(15,2),
    "estimated_total_cost" DECIMAL(15,2),
    "urgency_level" "risk_level" NOT NULL,
    "explanation_summary" TEXT NOT NULL,
    "explanation_factors" JSONB NOT NULL,
    "status" "recommendation_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" BIGSERIAL NOT NULL,
    "po_code" VARCHAR(50) NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "status" "po_status" NOT NULL DEFAULT 'DRAFT',
    "order_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promised_delivery_date" DATE NOT NULL,
    "actual_delivery_date" DATE,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "confirmed_by" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "ordered_quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "delivered_quantity" INTEGER NOT NULL DEFAULT 0,
    "defective_quantity" INTEGER NOT NULL DEFAULT 0,
    "accepted_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_history" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "promised_date" DATE NOT NULL,
    "actual_delivery_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_ordered_quantity" INTEGER NOT NULL,
    "total_delivered_quantity" INTEGER NOT NULL,
    "total_defective_quantity" INTEGER NOT NULL DEFAULT 0,
    "total_accepted_quantity" INTEGER NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    "is_on_time" BOOLEAN NOT NULL,
    "is_in_full" BOOLEAN NOT NULL,
    "is_otif" BOOLEAN NOT NULL,
    "notes" TEXT,
    "received_by" UUID NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_name" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100),
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category");

-- CreateIndex
CREATE INDEX "idx_products_is_active" ON "products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "idx_suppliers_is_active" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "idx_suppliers_status_tag" ON "suppliers"("status_tag");

-- CreateIndex
CREATE INDEX "idx_product_suppliers_sku" ON "product_suppliers"("product_sku");

-- CreateIndex
CREATE INDEX "idx_product_suppliers_supplier" ON "product_suppliers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_product_supplier" ON "product_suppliers"("product_sku", "supplier_id");

-- CreateIndex
CREATE INDEX "idx_inventory_risk_level" ON "inventory"("risk_level");

-- CreateIndex
CREATE INDEX "idx_inventory_is_dead_stock" ON "inventory"("is_dead_stock");

-- CreateIndex
CREATE INDEX "idx_sales_history_sku_date" ON "sales_history"("product_sku", "sale_date" DESC);

-- CreateIndex
CREATE INDEX "idx_sales_history_date" ON "sales_history"("sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "unique_product_sale_date" ON "sales_history"("product_sku", "sale_date");

-- CreateIndex
CREATE INDEX "idx_demand_forecasts_sku_date" ON "demand_forecasts"("product_sku", "forecast_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "unique_sku_forecast_horizon" ON "demand_forecasts"("product_sku", "forecast_date", "horizon_days");

-- CreateIndex
CREATE INDEX "idx_abc_xyz_analysis_date_seg" ON "abc_xyz_analysis"("analysis_date" DESC, "abc_xyz_segment");

-- CreateIndex
CREATE UNIQUE INDEX "unique_sku_analysis_date" ON "abc_xyz_analysis"("product_sku", "analysis_date");

-- CreateIndex
CREATE INDEX "idx_supplier_eval_supplier_date" ON "supplier_evaluations"("supplier_id", "evaluation_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "unique_supplier_evaluation_date" ON "supplier_evaluations"("supplier_id", "evaluation_date");

-- CreateIndex
CREATE INDEX "idx_purchase_recommendations_status" ON "purchase_recommendations"("status", "urgency_level");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_code_key" ON "purchase_orders"("po_code");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders"("status", "order_date" DESC);

-- CreateIndex
CREATE INDEX "idx_purchase_orders_supplier" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_order_id" ON "purchase_order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_order_product" ON "purchase_order_items"("order_id", "product_sku");

-- CreateIndex
CREATE INDEX "idx_delivery_history_supplier_date" ON "delivery_history"("supplier_id", "actual_delivery_date" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_date" ON "audit_logs"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_import_logs" ADD CONSTRAINT "data_import_logs_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "data_import_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_start_inputs" ADD CONSTRAINT "cold_start_inputs_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_start_inputs" ADD CONSTRAINT "cold_start_inputs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "abc_xyz_analysis_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "supplier_evaluation_weights_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "purchase_recommendations_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "purchase_recommendations_recommended_supplier_id_fkey" FOREIGN KEY ("recommended_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- POSTGRESQL CHECK CONSTRAINTS & TRIGGERS (FROM physical-schema.sql)
-- =============================================================================

-- Products Constraints
ALTER TABLE "products" ADD CONSTRAINT "check_cost_price_positive" CHECK (cost_price > 0);
ALTER TABLE "products" ADD CONSTRAINT "check_selling_price_positive" CHECK (selling_price > 0);
ALTER TABLE "products" ADD CONSTRAINT "check_default_lead_time_min" CHECK (default_lead_time >= 1);
ALTER TABLE "products" ADD CONSTRAINT "check_min_safety_stock_non_neg" CHECK (min_safety_stock >= 0);

-- Product Suppliers Constraints
ALTER TABLE "product_suppliers" ADD CONSTRAINT "check_purchase_price_positive" CHECK (purchase_price > 0);
ALTER TABLE "product_suppliers" ADD CONSTRAINT "check_moq_min" CHECK (moq >= 1);
ALTER TABLE "product_suppliers" ADD CONSTRAINT "check_pack_size_min" CHECK (pack_size >= 1);
ALTER TABLE "product_suppliers" ADD CONSTRAINT "check_committed_lead_time_min" CHECK (committed_lead_time >= 1);

-- Inventory Constraints
ALTER TABLE "inventory" ADD CONSTRAINT "check_on_hand_non_negative" CHECK (on_hand >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "check_on_order_non_negative" CHECK (on_order >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "check_safety_stock_non_negative" CHECK (safety_stock >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "check_reorder_point_non_negative" CHECK (reorder_point >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "check_max_stock_non_negative" CHECK (max_stock >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "check_days_of_supply_non_negative" CHECK (days_of_supply >= 0);

-- Inventory Snapshots Constraints
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "check_previous_on_hand_non_negative" CHECK (previous_on_hand >= 0);
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "check_new_on_hand_non_negative" CHECK (new_on_hand >= 0);

-- Data Import Logs Constraints
ALTER TABLE "data_import_logs" ADD CONSTRAINT "check_file_size_positive" CHECK (file_size_bytes > 0);
ALTER TABLE "data_import_logs" ADD CONSTRAINT "check_total_rows_non_negative" CHECK (total_rows >= 0);
ALTER TABLE "data_import_logs" ADD CONSTRAINT "check_successful_rows_non_negative" CHECK (successful_rows >= 0);
ALTER TABLE "data_import_logs" ADD CONSTRAINT "check_failed_rows_non_negative" CHECK (failed_rows >= 0);

-- Sales History Constraints
ALTER TABLE "sales_history" ADD CONSTRAINT "check_quantity_sold_non_negative" CHECK (quantity_sold >= 0);
ALTER TABLE "sales_history" ADD CONSTRAINT "check_revenue_non_negative" CHECK (revenue >= 0);

-- Cold Start Inputs Constraints
ALTER TABLE "cold_start_inputs" ADD CONSTRAINT "check_history_days_non_negative" CHECK (history_days_count >= 0);
ALTER TABLE "cold_start_inputs" ADD CONSTRAINT "check_expected_daily_sales_non_negative" CHECK (expected_daily_sales >= 0);

-- Demand Forecasts Constraints
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "check_horizon_days_valid" CHECK (horizon_days IN (7, 14, 30));
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "check_forecasted_demand_non_negative" CHECK (forecasted_demand >= 0);
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "check_daily_avg_demand_non_negative" CHECK (daily_avg_demand >= 0);
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "check_wape_non_negative" CHECK (wape IS NULL OR wape >= 0);
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "check_mae_non_negative" CHECK (mae IS NULL OR mae >= 0);

-- ABC-XYZ Analysis Constraints
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_window_days_30" CHECK (window_days = 30);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_total_revenue_non_negative" CHECK (total_revenue >= 0);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_revenue_pct_range" CHECK (revenue_pct >= 0 AND revenue_pct <= 100);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_cumulative_revenue_pct_range" CHECK (cumulative_revenue_pct >= 0 AND cumulative_revenue_pct <= 100);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_daily_sales_mean_non_negative" CHECK (daily_sales_mean >= 0);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_daily_sales_std_dev_non_negative" CHECK (daily_sales_std_dev >= 0);
ALTER TABLE "abc_xyz_analysis" ADD CONSTRAINT "check_cv_non_negative" CHECK (coefficient_of_variation >= 0);

-- Supplier Evaluation Weights Constraints
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_single_row_config" CHECK (id = 1);
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_weight_otif_non_negative" CHECK (weight_otif >= 0);
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_weight_quality_non_negative" CHECK (weight_quality >= 0);
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_weight_price_non_negative" CHECK (weight_price >= 0);
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_weight_leadtime_non_negative" CHECK (weight_leadtime >= 0);
ALTER TABLE "supplier_evaluation_weights" ADD CONSTRAINT "check_sum_100" CHECK ((weight_otif + weight_quality + weight_price + weight_leadtime) = 100.00);

-- Supplier Evaluations Constraints
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_delivery_count_non_negative" CHECK (delivery_count_analyzed >= 0);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_price_score_range" CHECK (price_score >= 0 AND price_score <= 100);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_otif_score_range" CHECK (otif_score >= 0 AND otif_score <= 100);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_quality_score_range" CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_lead_time_score_range" CHECK (lead_time_score >= 0 AND lead_time_score <= 100);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_total_score_range" CHECK (total_score >= 0 AND total_score <= 100);
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "check_rank_min" CHECK (rank IS NULL OR rank >= 1);

-- Purchase Recommendations Constraints
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "check_rec_horizon_days" CHECK (horizon_days IN (7, 14, 30));
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "check_suggested_quantity_non_negative" CHECK (suggested_quantity >= 0);
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "check_estimated_unit_price_positive" CHECK (estimated_unit_price IS NULL OR estimated_unit_price > 0);
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "check_estimated_total_cost_non_negative" CHECK (estimated_total_cost IS NULL OR estimated_total_cost >= 0);

-- Purchase Orders Constraints
ALTER TABLE "purchase_orders" ADD CONSTRAINT "check_total_amount_non_negative" CHECK (total_amount >= 0);

-- Purchase Order Items Constraints
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_ordered_quantity_positive" CHECK (ordered_quantity > 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_unit_price_positive" CHECK (unit_price > 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_total_price_positive" CHECK (total_price > 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_delivered_quantity_non_negative" CHECK (delivered_quantity >= 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_defective_quantity_non_negative" CHECK (defective_quantity >= 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_accepted_quantity_non_negative" CHECK (accepted_quantity >= 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "check_defective_le_delivered" CHECK (defective_quantity <= delivered_quantity);

-- Delivery History Constraints
ALTER TABLE "delivery_history" ADD CONSTRAINT "check_total_ordered_positive" CHECK (total_ordered_quantity > 0);
ALTER TABLE "delivery_history" ADD CONSTRAINT "check_total_delivered_non_negative" CHECK (total_delivered_quantity >= 0);
ALTER TABLE "delivery_history" ADD CONSTRAINT "check_total_defective_non_negative" CHECK (total_defective_quantity >= 0);
ALTER TABLE "delivery_history" ADD CONSTRAINT "check_total_accepted_non_negative" CHECK (total_accepted_quantity >= 0);
ALTER TABLE "delivery_history" ADD CONSTRAINT "check_lead_time_days_non_negative" CHECK (lead_time_days >= 0);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_suppliers BEFORE UPDATE ON "suppliers" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_product_suppliers BEFORE UPDATE ON "product_suppliers" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_inventory BEFORE UPDATE ON "inventory" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_cold_start_inputs BEFORE UPDATE ON "cold_start_inputs" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_weights BEFORE UPDATE ON "supplier_evaluation_weights" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_purchase_orders BEFORE UPDATE ON "purchase_orders" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Trigger for calculated_ip (IP = On-Hand + On-Order)
CREATE OR REPLACE FUNCTION trigger_calculate_inventory_ip()
RETURNS TRIGGER AS $$
BEGIN
  NEW.calculated_ip = NEW.on_hand + NEW.on_order;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_inventory_ip BEFORE INSERT OR UPDATE ON "inventory" FOR EACH ROW EXECUTE PROCEDURE trigger_calculate_inventory_ip();

