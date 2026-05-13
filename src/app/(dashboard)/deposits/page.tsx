"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  ShieldCheck, Loader2, Search, ArrowRightLeft, 
  CheckCircle2, XCircle, AlertCircle, Info
} from "lucide-react";
import { getDeposits, processRefund } from "@/app/actions/deposits";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Refund Modal state
  const [refundDeposit, setRefundDeposit] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [refundNotes, setRefundNotes] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getDeposits(targetBranch, statusFilter || undefined);
        setDeposits(data);
      } else {
        setDeposits([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenRefund = (deposit: any) => {
    setRefundDeposit(deposit);
    setRefundAmount(deposit.amount); // Default to full refund
    setDeductionAmount(0);
    setRefundNotes("");
  };

  const submitRefund = async () => {
    if (!refundDeposit) return;
    
    // Validate
    if (refundAmount + deductionAmount > refundDeposit.amount) {
      alert("ยอดคืนเงิน + ยอดหัก รวมกันต้องไม่เกินยอดมัดจำเริ่มต้น");
      return;
    }

    setIsRefunding(true);
    try {
      await processRefund(refundDeposit.id, refundAmount, deductionAmount, refundNotes);
      setRefundDeposit(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HELD": return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><ShieldCheck className="h-3 w-3" /> ถือครองอยู่</span>;
      case "PARTIALLY_REFUNDED": return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><ArrowRightLeft className="h-3 w-3" /> คืนบางส่วน</span>;
      case "REFUNDED": return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><CheckCircle2 className="h-3 w-3" /> คืนเงินแล้ว</span>;
      case "FORFEITED": return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><XCircle className="h-3 w-3" /> ยึดมัดจำ</span>;
      default: return null;
    }
  };

  const filteredData = deposits.filter(d => 
    d.contract.room.number.toLowerCase().includes(search.toLowerCase()) || 
    d.contract.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="เงินมัดจำ (Deposits)" subtitle="จัดการเงินประกันและคืนเงินมัดจำผู้เช่า" />

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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border px-4 py-2.5 bg-white text-sm focus:border-primary focus:outline-none shadow-sm"
            >
              <option value="">ทุกสถานะ</option>
              <option value="HELD">ถือครองอยู่ (Held)</option>
              <option value="REFUNDED">คืนเงินแล้ว (Refunded)</option>
              <option value="PARTIALLY_REFUNDED">คืนบางส่วน</option>
              <option value="FORFEITED">ยึดมัดจำ (Forfeited)</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="ค้นหาห้อง หรือผู้เช่า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบรายการมัดจำ</h3>
              <p className="text-sm text-text-muted">
                {search || statusFilter ? "ไม่มีรายการที่ตรงกับเงื่อนไข" : "ยังไม่มีรายการมัดจำในสาขานี้"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ห้องพัก</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ผู้เช่า / วันที่รับเงิน</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ยอดเงินมัดจำ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">สถานะมัดจำ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการคืนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((deposit) => {
                    const isHeld = deposit.status === "HELD";
                    return (
                      <tr key={deposit.id} className={`hover:bg-gray-50/50 transition-colors ${!isHeld ? 'opacity-80 bg-gray-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-base text-text-primary">ห้อง {deposit.contract.room.number}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{deposit.contract.room.branch.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-text-primary">{deposit.contract.customer.name}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            รับเงินเมื่อ: {new Date(deposit.receivedAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-blue-600">฿{deposit.amount.toLocaleString()}</div>
                          {!isHeld && (
                            <div className="text-[11px] text-text-secondary mt-0.5">
                              (คืน: ฿{deposit.refundedAmount.toLocaleString()})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(deposit.status)}
                          {deposit.notes && (
                            <div className="mt-1 text-[11px] text-text-muted max-w-[200px] truncate" title={deposit.notes}>
                              {deposit.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isHeld ? (
                            <button
                              onClick={() => handleOpenRefund(deposit)}
                              className="px-4 py-1.5 bg-white border border-border rounded-lg text-[12px] font-bold text-text-primary hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              คืนเงิน/หักมัดจำ
                            </button>
                          ) : (
                            <span className="text-[11px] text-text-muted flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-3 w-3" /> ดำเนินการแล้ว
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {refundDeposit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-text-primary text-lg">จัดการคืนเงินมัดจำ</h3>
              <p className="text-sm text-text-muted mt-1">ห้อง {refundDeposit.contract.room.number} • คุณ {refundDeposit.contract.customer.name}</p>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium text-blue-600 mb-0.5">ยอดมัดจำเริ่มต้น</div>
                  <div className="font-bold text-xl text-blue-800">฿{refundDeposit.amount.toLocaleString()}</div>
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-200" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-text-secondary flex items-center justify-between mb-1.5">
                    <span>ยอดหักค่าเสียหาย / ค้างชำระ (บาท)</span>
                  </label>
                  <input
                    type="number"
                    value={deductionAmount === 0 ? "" : deductionAmount}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      setDeductionAmount(val);
                      // Auto calculate refund
                      setRefundAmount(Math.max(0, refundDeposit.amount - val));
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-red-600 font-bold"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-text-secondary flex items-center justify-between mb-1.5">
                    <span>ยอดคืนเงินให้ลูกค้า (บาท)</span>
                  </label>
                  <input
                    type="number"
                    value={refundAmount === 0 ? "" : refundAmount}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      setRefundAmount(val);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-emerald-600 font-bold"
                  />
                </div>
                
                {refundAmount + deductionAmount > refundDeposit.amount && (
                  <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> ยอดรวมเกินจำนวนมัดจำเริ่มต้น!
                  </div>
                )}
                {refundAmount + deductionAmount < refundDeposit.amount && (
                  <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> ยังมียอดคงเหลือ {refundDeposit.amount - refundAmount - deductionAmount} บาท ที่ยังไม่ได้จัดการ
                  </div>
                )}

                <div>
                  <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หมายเหตุ (สาเหตุที่หักเงิน ฯลฯ)</label>
                  <textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="เช่น หักค่ากุญแจหาย, ทำความสะอาด..."
                  />
                </div>
              </div>

            </div>
            <div className="grid grid-cols-2 bg-gray-50/50">
              <button 
                onClick={() => setRefundDeposit(null)} 
                className="py-3.5 text-sm font-medium text-text-secondary border-t border-r border-border hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={submitRefund}
                disabled={isRefunding || (refundAmount + deductionAmount > refundDeposit.amount)}
                className="py-3.5 text-sm font-bold text-primary border-t border-border hover:bg-primary-light transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isRefunding ? "กำลังบันทึก..." : "ยืนยันการทำรายการ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
