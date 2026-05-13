"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  CalendarRange, Plus, Loader2, Edit2, Trash2, Tag, ArrowRight
} from "lucide-react";
import { getSeasonalPrices, deleteSeasonalPrice } from "@/app/actions/pricing";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { PricingFormDialog, PricingFormData } from "@/components/pricing/pricing-form-dialog";

export default function PricingPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PricingFormData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getSeasonalPrices(targetBranch);
        setPrices(data);
      } else {
        setPrices([]);
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบราคาพิเศษช่วง "${name}"?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteSeasonalPrice(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleEdit = (price: any) => {
    setEditingPrice({
      id: price.id,
      branchId: price.branchId,
      roomType: price.roomType,
      name: price.name,
      startDate: price.startDate,
      endDate: price.endDate,
      price: price.price,
    });
    setIsDialogOpen(true);
  };

  const getRoomTypeBadge = (type: string) => {
    switch (type) {
      case "STANDARD": return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">Standard</span>;
      case "DELUXE": return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold">Deluxe</span>;
      case "SUITE": return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold">Suite</span>;
      case "STUDIO": return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">Studio</span>;
      case "ONE_BED": return <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-[11px] font-bold">1-Bedroom</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-bold">{type}</span>;
    }
  };

  const isCurrentSeason = (start: string, end: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    const endDate = new Date(end);
    return today >= startDate && today <= endDate;
  };

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="ราคาห้องพัก (Pricing)" subtitle="จัดการราคาห้องพักปกติ และราคาพิเศษตามช่วงเวลา (Seasonal Pricing)" />

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-xl border border-border px-4 py-2.5 bg-white text-sm focus:border-primary focus:outline-none shadow-sm min-w-[200px]"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingPrice(null);
              setIsDialogOpen(true);
            }}
            disabled={!branchId}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            เพิ่มราคาช่วงเวลาใหม่
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <CalendarRange className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบการตั้งราคาพิเศษ</h3>
              <p className="text-sm text-text-muted">
                คุณยังไม่ได้ตั้งราคาห้องพักตามช่วงเวลาสำหรับสาขานี้
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">เทศกาล / ช่วงเวลา</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ประเภทห้อง</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ราคา (บาท/คืน)</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prices.map((price) => {
                    const isCurrent = isCurrentSeason(price.startDate, price.endDate);
                    
                    return (
                      <tr key={price.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isCurrent && <div className="h-2 w-2 rounded-full bg-emerald-500" title="ช่วงเวลาปัจจุบัน" />}
                            <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 text-text-muted" /> {price.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoomTypeBadge(price.roomType)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-base text-purple-600">฿{price.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                            <span className={isCurrent ? "text-emerald-600" : ""}>
                              {new Date(price.startDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
                            <span className={isCurrent ? "text-emerald-600" : ""}>
                              {new Date(price.endDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(price)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors"
                              title="แก้ไข"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(price.id, price.name)}
                              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      <PricingFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingPrice}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
