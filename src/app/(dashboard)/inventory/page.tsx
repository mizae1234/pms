"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  Package, Plus, Loader2, Search, Edit2, Trash2, 
  ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw
} from "lucide-react";
import { getInventoryItems, deleteInventoryItem, adjustInventoryStock } from "@/app/actions/inventory";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { InventoryFormDialog, InventoryFormData } from "@/components/inventory/inventory-form-dialog";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryFormData | null>(null);

  // Stock Adjust Modal state
  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getInventoryItems(targetBranch, search);
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, branchId, loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${name}"?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteInventoryItem(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem({
      id: item.id,
      branchId: item.branchId,
      name: item.name,
      category: item.category || "",
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      cost: item.cost || 0,
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const submitAdjust = async () => {
    if (!adjustItem || adjustAmount === 0) {
      setAdjustItem(null);
      return;
    }
    setIsAdjusting(true);
    try {
      await adjustInventoryStock(adjustItem.id, adjustAmount);
      setAdjustItem(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการปรับสต็อก");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="สต็อกของใช้ (Inventory)" subtitle="จัดการรายการสิ่งของและตรวจสอบจำนวนสต็อกคงเหลือ" />

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

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="ค้นหาสิ่งของ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsDialogOpen(true);
            }}
            disabled={!branchId}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสิ่งของใหม่
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบรายการสิ่งของ</h3>
              <p className="text-sm text-text-muted">
                {search ? "ไม่มีสิ่งของที่ตรงกับการค้นหา" : "ยังไม่มีรายการในสต็อกสำหรับสาขานี้"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">สิ่งของ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">หมวดหมู่</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">คงเหลือ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-center">อัปเดตสต็อก</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const isLowStock = item.quantity <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text-primary text-sm">
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{item.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[11px] font-medium">
                            {item.category || "ไม่มีหมวดหมู่"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-bold text-base flex items-center justify-end gap-1.5 ${isLowStock ? 'text-red-600' : 'text-text-primary'}`}>
                            {isLowStock && <AlertCircle className="h-4 w-4" />}
                            {item.quantity}
                          </div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            {item.unit} (ขั้นต่ำ {item.minStock})
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => { setAdjustItem(item); setAdjustAmount(1); }}
                              className="h-8 w-8 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-100"
                              title="เพิ่มทีละ 1"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setAdjustItem(item); setAdjustAmount(0); }}
                              className="h-8 px-3 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-[12px] font-bold transition-colors border border-blue-100"
                            >
                              ปรับยอด...
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
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

      <InventoryFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingItem}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-border text-center">
              <h3 className="font-bold text-text-primary text-lg">ปรับยอดสต็อก</h3>
              <p className="text-sm text-text-muted mt-1">{adjustItem.name}</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-[11px] text-text-muted mb-1">ปัจจุบัน</div>
                  <div className="font-bold text-xl">{adjustItem.quantity}</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="text-center">
                  <div className="text-[11px] text-text-muted mb-1">ยอดใหม่</div>
                  <div className={`font-bold text-xl ${adjustAmount > 0 ? 'text-emerald-600' : adjustAmount < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                    {Math.max(0, adjustItem.quantity + adjustAmount)}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-secondary text-center">
                  ระบุจำนวนที่ต้องการปรับ (+ หรือ -)
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setAdjustAmount(prev => prev - 1)} className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">-</button>
                  <input
                    type="number"
                    value={adjustAmount === 0 ? "" : adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-24 h-10 text-center font-bold border border-border rounded-xl focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                  <button onClick={() => setAdjustAmount(prev => prev + 1)} className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">+</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-gray-50/50">
              <button 
                onClick={() => setAdjustItem(null)} 
                className="py-3.5 text-sm font-medium text-text-secondary border-t border-r border-border hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={submitAdjust}
                disabled={isAdjusting || adjustAmount === 0}
                className="py-3.5 text-sm font-bold text-primary border-t border-border hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {isAdjusting ? "กำลังบันทึก..." : "บันทึกยอด"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
