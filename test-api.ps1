# ==============================================================================
# DSS AI PURCHASE — AUTOMATED API HEALTH & SMOKE TEST SCRIPT (POWERSHELL)
# ==============================================================================
param(
    [string]$BaseUrl = "http://localhost:3000/api/v1",
    [string]$HostUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  DSS AI PURCHASE — KIỂM TRA TOÀN DIỆN HỆ THỐNG API" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            TimeoutSec = 10
        }
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $res = Invoke-RestMethod @params
        $stopwatch.Stop()
        Write-Host " [PASS] " -ForegroundColor Green -NoNewline
        Write-Host "$Method $Name " -ForegroundColor White -NoNewline
        Write-Host "($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Gray
        return $res
    }
    catch {
        $stopwatch.Stop()
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " [PASS] " -ForegroundColor Green -NoNewline
            Write-Host "$Method $Name " -ForegroundColor White -NoNewline
            Write-Host "(Status $statusCode as expected, $($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Gray
            return $null
        }
        Write-Host " [FAIL] " -ForegroundColor Red -NoNewline
        Write-Host "$Method $Name " -ForegroundColor Yellow -NoNewline
        Write-Host "(Status: $statusCode, Err: $($_.Exception.Message))" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
Write-Host "1. Kiểm tra Health Endpoint:" -ForegroundColor Yellow
Test-Endpoint -Name "/health" -Uri "$HostUrl/health" | Out-Null
Test-Endpoint -Name "/api/v1/health" -Uri "$BaseUrl/health" | Out-Null

# 2. Authentication
Write-Host "`n2. Kiểm tra Authentication & Quyền hạn:" -ForegroundColor Yellow
$loginBody = '{"username":"admin","password":"Admin@123"}'
$loginRes = Test-Endpoint -Name "POST /auth/login (Admin)" -Method "POST" -Uri "$BaseUrl/auth/login" -Body $loginBody

if (-not $loginRes -or -not $loginRes.data.accessToken) {
    Write-Host "`n[ERROR] Không thể lấy Access Token. Dừng kiểm tra các API bảo vệ." -ForegroundColor Red
    exit 1
}

$token = $loginRes.data.accessToken
$authHeader = @{ Authorization = "Bearer $token" }

Test-Endpoint -Name "GET /auth/me" -Uri "$BaseUrl/auth/me" -Headers $authHeader | Out-Null

# 3. Product Catalog
Write-Host "`n3. Kiểm tra Quản lý Sản phẩm (SKU):" -ForegroundColor Yellow
$productsRes = Test-Endpoint -Name "GET /products (Danh sách 10 SKU)" -Uri "$BaseUrl/products?page=1&limit=10" -Headers $authHeader
if ($productsRes -and $productsRes.data.Count -gt 0) {
    $firstSku = $productsRes.data[0].sku
    Test-Endpoint -Name "GET /products/$firstSku (Chi tiết SKU)" -Uri "$BaseUrl/products/$firstSku" -Headers $authHeader | Out-Null
}

# 4. Data Import & Template
Write-Host "`n4. Kiểm tra Nhập liệu & File mẫu Excel/CSV:" -ForegroundColor Yellow
try {
    $tplRes = Invoke-WebRequest -Uri "$BaseUrl/data-import/templates/SALES_HISTORY?format=xlsx" -Headers $authHeader -Method Get
    Write-Host " [PASS] " -ForegroundColor Green -NoNewline
    Write-Host "GET /data-import/templates/SALES_HISTORY?format=xlsx " -ForegroundColor White -NoNewline
    Write-Host "(File Excel size: $($tplRes.RawContentLength) bytes)" -ForegroundColor Gray
} catch {
    Write-Host " [FAIL] GET /data-import/templates/SALES_HISTORY: $($_.Exception.Message)" -ForegroundColor Red
}
Test-Endpoint -Name "GET /data-import/history" -Uri "$BaseUrl/data-import/history?page=1&limit=5" -Headers $authHeader | Out-Null

# 5. Inventory & DSS
Write-Host "`n5. Kiểm tra Tồn kho & Phân tích DSS:" -ForegroundColor Yellow
Test-Endpoint -Name "GET /inventory/summary" -Uri "$BaseUrl/inventory/summary" -Headers $authHeader | Out-Null
Test-Endpoint -Name "GET /inventory/items?riskLevel=CRITICAL" -Uri "$BaseUrl/inventory/items?riskLevel=CRITICAL&limit=5" -Headers $authHeader | Out-Null
Test-Endpoint -Name "GET /inventory/abc-xyz-matrix" -Uri "$BaseUrl/inventory/abc-xyz-matrix" -Headers $authHeader | Out-Null

# 6. AI Recommendations
Write-Host "`n6. Kiểm tra Khuyến nghị Mua hàng AI:" -ForegroundColor Yellow
Test-Endpoint -Name "GET /recommendations?status=PENDING" -Uri "$BaseUrl/recommendations?status=PENDING&limit=5" -Headers $authHeader | Out-Null

# 7. Purchase Orders
Write-Host "`n7. Kiểm tra Đơn mua hàng (PO):" -ForegroundColor Yellow
Test-Endpoint -Name "GET /purchase-orders" -Uri "$BaseUrl/purchase-orders?page=1&limit=5" -Headers $authHeader | Out-Null

# 8. Suppliers
Write-Host "`n8. Kiểm tra Nhà cung cấp & Bảng điểm OTIF:" -ForegroundColor Yellow
$suppliersRes = Test-Endpoint -Name "GET /suppliers" -Uri "$BaseUrl/suppliers" -Headers $authHeader
if ($suppliersRes -and $suppliersRes.data.Count -gt 0) {
    $firstSupId = $suppliersRes.data[0].id
    Test-Endpoint -Name "GET /suppliers/$firstSupId/performance" -Uri "$BaseUrl/suppliers/$firstSupId/performance" -Headers $authHeader | Out-Null
}

# 9. System Config
Write-Host "`n9. Kiểm tra Thiết lập cấu hình DSS:" -ForegroundColor Yellow
Test-Endpoint -Name "GET /config/supplier-weights" -Uri "$BaseUrl/config/supplier-weights" -Headers $authHeader | Out-Null
Test-Endpoint -Name "GET /config/inventory-thresholds" -Uri "$BaseUrl/config/inventory-thresholds" -Headers $authHeader | Out-Null

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  HOÀN TẤT BỘ TEST SMOKE! TẤT CẢ API HOẠT ĐỘNG TỐT" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Cyan
