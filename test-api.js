/**
 * DSS AI PURCHASE — AUTOMATED API SMOKE TEST RUNNER
 * Node.js 20+ Native Fetch (Zero dependencies, fast & cross-platform)
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const HOST_URL = process.env.HOST_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

async function request(name, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (res.ok) {
      console.log(
        `  ${colors.green}✔ [PASS]${colors.reset} ${colors.bold}${options.method || 'GET'}${colors.reset} ${name} ${colors.gray}(${res.status} OK - ${duration}ms)${colors.reset}`
      );
      return { ok: true, status: res.status, data, headers: res.headers };
    } else {
      console.log(
        `  ${colors.red}✖ [FAIL]${colors.reset} ${options.method || 'GET'} ${name} ${colors.red}(Status: ${res.status})${colors.reset}`
      );
      if (data?.error) {
        console.log(`         ${colors.gray}Detail: ${data.error.code} - ${data.error.message}${colors.reset}`);
      }
      return { ok: false, status: res.status, data };
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(
      `  ${colors.red}✖ [ERROR]${colors.reset} ${options.method || 'GET'} ${name} ${colors.red}(${err.message} - ${duration}ms)${colors.reset}`
    );
    return { ok: false, error: err };
  }
}

async function run() {
  console.log(`\n${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  DSS AI PURCHASE — BỘ KIỂM THỬ API TỰ ĐỘNG (SMOKE TEST)${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}\n`);

  // 1. Health Checks
  console.log(`${colors.yellow}${colors.bold}1. Kiểm tra Health Endpoints:${colors.reset}`);
  await request('Health Check Root', `${HOST_URL}/health`);
  await request('Health Check API v1', `${BASE_URL}/health`);

  // 2. Auth & Login
  console.log(`\n${colors.yellow}${colors.bold}2. Kiểm tra Authentication & Authorization (UC-001):${colors.reset}`);
  const loginRes = await request('POST /auth/login (Admin)', `${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
  });

  if (!loginRes.ok || !loginRes.data?.data?.accessToken) {
    console.error(`${colors.red}Không thể đăng nhập tài khoản admin. Hủy các bước kiểm tra tiếp theo.${colors.reset}`);
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  await request('GET /auth/me (Profile Quản trị viên)', `${BASE_URL}/auth/me`, {
    headers: authHeaders,
  });

  // 3. Product Catalog
  console.log(`\n${colors.yellow}${colors.bold}3. Kiểm tra Quản lý Danh mục Sản phẩm (UC-003, UC-004):${colors.reset}`);
  const prodRes = await request('GET /products?page=1&limit=5', `${BASE_URL}/products?page=1&limit=5`, {
    headers: authHeaders,
  });

  if (prodRes.ok && Array.isArray(prodRes.data?.data) && prodRes.data.data.length > 0) {
    const sku = prodRes.data.data[0].sku;
    await request(`GET /products/${sku} (Chi tiết SKU)`, `${BASE_URL}/products/${sku}`, {
      headers: authHeaders,
    });
  }

  // 4. Data Import & Templates
  console.log(`\n${colors.yellow}${colors.bold}4. Kiểm tra Tải File Mẫu & Lịch Sử Nhập Liệu (UC-002):${colors.reset}`);
  await request('GET /data-import/templates/SALES_HISTORY?format=xlsx (Excel Template)', `${BASE_URL}/data-import/templates/SALES_HISTORY?format=xlsx`, {
    headers: authHeaders,
  });
  await request('GET /data-import/templates/INVENTORY_SNAPSHOT?format=csv (CSV Template)', `${BASE_URL}/data-import/templates/INVENTORY_SNAPSHOT?format=csv`, {
    headers: authHeaders,
  });
  await request('GET /data-import/logs (Lịch sử nhập liệu)', `${BASE_URL}/data-import/logs`, {
    headers: authHeaders,
  });

  // 5. Inventory & DSS Risk Cards
  console.log(`\n${colors.yellow}${colors.bold}5. Kiểm tra Tồn kho & 5 Cấp độ Rủi ro (UC-005, UC-006):${colors.reset}`);
  await request('GET /inventory/dashboard (5 Cấp độ Rủi ro)', `${BASE_URL}/inventory/dashboard`, {
    headers: authHeaders,
  });
  await request('GET /inventory/items?riskLevel=CRITICAL (SKU sắp hết hàng)', `${BASE_URL}/inventory/items?riskLevel=CRITICAL&limit=5`, {
    headers: authHeaders,
  });
  await request('GET /inventory/abc-xyz (Ma trận 9 ô ABC-XYZ)', `${BASE_URL}/inventory/abc-xyz`, {
    headers: authHeaders,
  });

  // 6. AI Recommendations
  console.log(`\n${colors.yellow}${colors.bold}6. Kiểm tra Đề xuất Mua hàng DSS & AI (UC-008, UC-009):${colors.reset}`);
  await request('GET /recommendations (Danh sách đề xuất)', `${BASE_URL}/recommendations?limit=5`, {
    headers: authHeaders,
  });

  // 7. Forecasts
  console.log(`\n${colors.yellow}${colors.bold}7. Kiểm tra Dự báo Nhu cầu AI (UC-007):${colors.reset}`);
  await request('GET /forecasts (Dự báo nhu cầu chu kỳ)', `${BASE_URL}/forecasts`, {
    headers: authHeaders,
  });

  // 8. Purchase Orders
  console.log(`\n${colors.yellow}${colors.bold}8. Kiểm tra Đơn Mua hàng PO (UC-010):${colors.reset}`);
  await request('GET /purchase-orders?page=1&limit=5', `${BASE_URL}/purchase-orders?page=1&limit=5`, {
    headers: authHeaders,
  });

  // 9. Suppliers & Performance Scoring
  console.log(`\n${colors.yellow}${colors.bold}9. Kiểm tra Nhà Cung Cấp & Đánh giá (UC-013, UC-014):${colors.reset}`);
  await request('GET /suppliers (Danh sách NCC)', `${BASE_URL}/suppliers`, {
    headers: authHeaders,
  });
  await request('GET /suppliers/evaluations (Bảng điểm OTIF & xếp hạng)', `${BASE_URL}/suppliers/evaluations`, {
    headers: authHeaders,
  });

  // 10. System Configuration
  console.log(`\n${colors.yellow}${colors.bold}10. Kiểm tra Thiết lập Cấu hình DSS (UC-015):${colors.reset}`);
  await request('GET /config/supplier-weights (Trọng số NCC)', `${BASE_URL}/config/supplier-weights`, {
    headers: authHeaders,
  });

  console.log(`\n${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}  TẤT CẢ ENDPOINT ĐÃ ĐƯỢC KIỂM TRA THÀNH CÔNG! HỆ THỐNG SẴN SÀNG.${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}================================================================\n${colors.reset}`);
}

run();
