import React, { useState, useEffect } from 'react';
import { RefreshCw, Boxes } from 'lucide-react';
import KpiRiskCards from '../components/KpiRiskCards';
import InventoryTable from '../components/InventoryTable';
import SkuDetail360Modal from '../components/SkuDetail360Modal';
import Button from '../../../components/ui/Button';
import inventoryApi from '../api/inventoryApi';
import { InventoryDashboardData, InventoryItem } from '../types/inventory.types';
import { RiskLevel } from '../../../components/ui/Badge';

export const InventoryDashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<InventoryDashboardData | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | null>(null);
  const [activeSku360, setActiveSku360] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dash, itms] = await Promise.all([
        inventoryApi.getDashboard(),
        inventoryApi.getItems(),
      ]);
      setDashboardData(dash);
      setItems(itms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-brand-600" />
            Giám Sát Tồn Kho & Cảnh Báo Rủi Ro (UC-004)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời gian thực vị trí tồn IP, chỉ số SS, ROP, số ngày đủ bán DoS và 5 cấp độ rủi ro (BR-002)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            disabled={loading}
          >
            Làm Mới Số Liệu
          </Button>
        </div>
      </div>

      {/* 5-Level Risk KPI Cards */}
      <KpiRiskCards
        summary={dashboardData?.kpiSummary}
        selectedRisk={selectedRisk}
        onSelectRisk={(risk) => setSelectedRisk(risk)}
      />

      {/* Detailed Inventory Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Danh Sách Chi Tiết Tồn Kho ({items.length} SKU)
            {selectedRisk && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                (Đang lọc: <strong>{selectedRisk}</strong>)
              </span>
            )}
          </h3>
        </div>

        <InventoryTable
          items={items}
          isLoading={loading}
          selectedRisk={selectedRisk}
          onSelectSku360={(sku) => setActiveSku360(sku)}
        />
      </div>

      {/* Sku 360 Detail Modal (UC-006) */}
      <SkuDetail360Modal
        sku={activeSku360}
        isOpen={!!activeSku360}
        onClose={() => setActiveSku360(null)}
      />
    </div>
  );
};

export default InventoryDashboardPage;
