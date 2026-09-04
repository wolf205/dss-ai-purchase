import { useEffect, useState } from 'react';
import { 
  Boxes, 
  BrainCircuit, 
  Server, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PackagePlus
} from 'lucide-react';

interface BackendHealth {
  status: string;
  service: string;
  database: string;
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBackendHealth(data.data);
        }
      })
      .catch((err) => {
        console.warn('Backend currently unreachable from client browser:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const riskLevels = [
    { name: 'Hết hàng (Out of Stock)', code: 'OUT_OF_STOCK', color: 'bg-risk-out-of-stock', icon: TrendingDown, desc: 'Tồn thực = 0, cần đặt khẩn cấp' },
    { name: 'Nguy cấp (Critical)', code: 'CRITICAL', color: 'bg-risk-critical', icon: AlertCircle, desc: 'Tồn ≤ SS hoặc DoS ≤ 3 ngày' },
    { name: 'Cảnh báo (Warning)', code: 'WARNING', color: 'bg-risk-warning', icon: AlertTriangle, desc: 'SS < Tồn ≤ ROP hoặc DoS ≤ 7 ngày' },
    { name: 'An toàn (Healthy)', code: 'NORMAL', color: 'bg-risk-healthy', icon: ShieldCheck, desc: 'ROP < Tồn ≤ 2×ROP' },
    { name: 'Tồn dư (Overstock)', code: 'OVERSTOCK', color: 'bg-risk-overstock', icon: PackagePlus, desc: 'Tồn > 2×ROP hoặc DoS > 30 ngày' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  DSS AI Purchase
                </h1>
                <p className="text-slate-400 text-sm">
                  Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI (Phase 0 Foundation)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Phase 0 Scaffolded & Active</span>
          </div>
        </header>

        {/* System Architecture Connectivity Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Backend Node.js */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sky-400 font-semibold">
                <Server className="w-5 h-5" />
                <span>Backend Express API</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">Port 5000</span>
            </div>
            <p className="text-xs text-slate-400">
              Clean Architecture + Prisma ORM + Uniform Envelope + JWT RBAC
            </p>
            <div className="pt-2 text-xs flex items-center gap-2">
              {loading ? (
                <span className="text-slate-500">Đang kiểm tra kết nối...</span>
              ) : backendHealth ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Service UP ({backendHealth.database})
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Sẵn sàng qua Docker Compose
                </span>
              )}
            </div>
          </div>

          {/* Card 2: AI Forecasting Engine */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-400 font-semibold">
                <BrainCircuit className="w-5 h-5" />
                <span>AI Forecasting Service</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">Port 8000</span>
            </div>
            <p className="text-xs text-slate-400">
              Python FastAPI + Stateless Pure Compute + Holt-Winters & SMA-7
            </p>
            <div className="pt-2 text-xs text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Endpoint: /health & /docs
            </div>
          </div>

          {/* Card 3: PostgreSQL Database */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-teal-400 font-semibold">
                <Database className="w-5 h-5" />
                <span>PostgreSQL 16 Engine</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">Port 5432</span>
            </div>
            <p className="text-xs text-slate-400">
              18 Bảng 3NF + 12 ENUMs + Triggers + Ràng buộc CHECK toán học
            </p>
            <div className="pt-2 text-xs text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã nạp tài khoản admin & trọng số BR-013
            </div>
          </div>

        </section>

        {/* 5-Level Risk Palette Preview (BR-002) */}
        <section className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Boxes className="w-5 h-5 text-sky-400" />
            <span>Tiêu Chuẩn Bảng Màu 5 Cấp Độ Rủi Ro Tồn Kho (BR-002 & Frontend Architecture)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {riskLevels.map((risk) => {
              const Icon = risk.icon;
              return (
                <div 
                  key={risk.code}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between space-y-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-3 h-3 rounded-full ${risk.color} ring-4 ring-slate-900`} />
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white tracking-wide">{risk.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-tight">{risk.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-500 pt-4">
          DSS AI Purchase • Kiến trúc Clean Architecture Monorepo • Sẵn sàng triển khai Phase 1
        </footer>

      </div>
    </div>
  );
}
