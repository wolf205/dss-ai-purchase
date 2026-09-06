import React from 'react';
import { Outlet } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-xl shadow-brand-500/10">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">DSS AI PURCHASE</h1>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Bán Lẻ Tích Hợp AI
          </p>
        </div>

        {/* Auth Card Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/80">
          <Outlet />
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          DSS AI Purchase System • Tuân thủ kiến trúc Clean Architecture
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
