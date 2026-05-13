"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  BarChart3, Loader2, PieChart, TrendingUp, AlertCircle, 
  Building2, Calendar, DollarSign, Download
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/reports";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Filters
  const [branchId, setBranchId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getDashboardStats(targetBranch, selectedMonth, selectedYear);
        setStats(data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50 overflow-y-auto">
      <Header title="รายงานและสถิติ (Reports & Analytics)" subtitle="ภาพรวมผลประกอบการ และอัตราการเข้าพัก" />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-text-muted hidden sm:block" />
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-xl border border-border px-4 py-2 bg-gray-50 text-sm focus:border-primary focus:outline-none"
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-text-muted hidden sm:block" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-border px-4 py-2 bg-gray-50 text-sm focus:border-primary focus:outline-none"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-border px-4 py-2 bg-gray-50 text-sm focus:border-primary focus:outline-none"
              >
                {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
              </select>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors w-full sm:w-auto justify-center shadow-sm">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-text-secondary">รายรับรวม (Revenue)</div>
                  <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">฿{stats.finance.totalRevenue.toLocaleString()}</div>
                  <div className="text-[12px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> รับจริงในเดือนนี้
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-text-secondary">อัตราเข้าพัก (Occupancy)</div>
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <PieChart className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{stats.occupancy.rate.toFixed(1)}%</div>
                  <div className="text-[12px] text-text-muted mt-1">
                    ({stats.occupancy.counts.OCCUPIED} จาก {stats.occupancy.total} ห้อง)
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-text-secondary">ยอดค้างชำระ (Overdue)</div>
                  <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">฿{stats.finance.overdueAmount.toLocaleString()}</div>
                  <div className="text-[12px] text-red-500 font-medium mt-1">
                    จากบิลที่เกินกำหนดชำระ
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-text-secondary">เงินมัดจำคงค้าง (Deposits)</div>
                  <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">฿{stats.finance.depositsHeld.toLocaleString()}</div>
                  <div className="text-[12px] text-text-muted mt-1">
                    จำนวนมัดจำที่ระบบถือครองอยู่
                  </div>
                </div>
              </div>

            </div>

            {/* Charts / Details section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" /> สถานะห้องพักปัจจุบัน
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium">ห้องว่างพร้อมขาย (Available)</span>
                    </div>
                    <span className="font-bold text-lg">{stats.occupancy.counts.AVAILABLE}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">มีผู้พักอาศัย (Occupied)</span>
                    </div>
                    <span className="font-bold text-lg">{stats.occupancy.counts.OCCUPIED}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-medium">กำลังทำความสะอาด (Cleaning)</span>
                    </div>
                    <span className="font-bold text-lg">{stats.occupancy.counts.CLEANING}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">ปิดปรับปรุง/แจ้งซ่อม (Maintenance)</span>
                    </div>
                    <span className="font-bold text-lg">{stats.occupancy.counts.MAINTENANCE}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" /> สรุปการเรียกเก็บเงินเดือนนี้
                  </h3>
                </div>
                
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl bg-gray-50/50">
                  {/* Placeholder for actual chart library (e.g. Recharts/Chartjs) */}
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-600 mb-2">฿{stats.finance.totalInvoiced.toLocaleString()}</div>
                    <div className="text-sm text-text-secondary">ยอดเรียกเก็บทั้งหมด (Invoiced)</div>
                  </div>
                  <div className="w-full max-w-sm mt-6 flex h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${stats.finance.totalInvoiced > 0 ? (stats.finance.totalRevenue / stats.finance.totalInvoiced) * 100 : 0}%` }}
                    ></div>
                    <div 
                      className="bg-red-500 h-full transition-all" 
                      style={{ width: `${stats.finance.totalInvoiced > 0 ? (stats.finance.overdueAmount / stats.finance.totalInvoiced) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-4 mt-3 text-[11px] font-medium text-text-muted">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> รับชำระแล้ว</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> ค้างชำระ</div>
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
