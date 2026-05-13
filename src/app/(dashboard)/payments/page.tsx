"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  CreditCard, Loader2, Search, ArrowDownToLine, Receipt
} from "lucide-react";
import { getPayments } from "@/app/actions/payments";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getPayments(targetBranch);
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "เงินสด (Cash)";
      case "BANK_TRANSFER": return "โอนเงิน (Transfer)";
      case "CREDIT_CARD": return "บัตรเครดิต (Credit Card)";
      case "QR_CODE": return "สแกนคิวอาร์ (QR Code)";
      default: return "อื่นๆ";
    }
  };

  const filteredData = payments.filter(p => {
    const s = search.toLowerCase();
    return (
      (p.invoice?.number || "").toLowerCase().includes(s) ||
      (p.invoice?.customer?.name || "").toLowerCase().includes(s) ||
      (p.referenceNo || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="ประวัติการรับชำระเงิน (Payments)" subtitle="ดูรายการรับชำระเงินทั้งหมดจากบิลและการจอง" />

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-xl border border-border px-4 py-2.5 bg-white text-sm focus:border-primary focus:outline-none shadow-sm"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า หรือเลขอ้างอิง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>
          
          <button className="flex items-center justify-center gap-2 bg-white border border-border hover:bg-gray-50 text-text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 w-full sm:w-auto">
            <ArrowDownToLine className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบประวัติการรับชำระเงิน</h3>
              <p className="text-sm text-text-muted">
                {search ? "ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา" : "ยังไม่มีการรับชำระเงินในระบบ"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">วันที่ชำระ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">อ้างอิง (บิล/การจอง)</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ช่องทางการชำระ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">เลขอ้างอิงการโอน</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-text-primary">
                          {new Date(payment.paidAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {new Date(payment.paidAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.invoice ? (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-max">
                            <Receipt className="h-3.5 w-3.5" />
                            {payment.invoice.number}
                          </div>
                        ) : payment.booking ? (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded w-max">
                            ห้อง {payment.booking.room.number}
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          {payment.invoice?.customer?.name || payment.booking?.customer?.name || "ไม่ระบุ"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary">
                          {getMethodLabel(payment.method)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary">
                          {payment.referenceNo || "-"}
                        </div>
                        {payment.notes && (
                          <div className="text-[11px] text-text-muted mt-0.5 truncate max-w-[150px]" title={payment.notes}>
                            {payment.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-base text-emerald-600">
                          + ฿{payment.amount.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
