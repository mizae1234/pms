"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, FileText, Building2, User, Plus, Trash2, DollarSign } from "lucide-react";
import { createInvoice } from "@/app/actions/invoices";
import { getAvailableBranches, getCustomersForDropdown } from "@/app/actions/booking-helpers";

interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

export interface InvoiceFormData {
  branchId: string;
  customerId: string;
  items: InvoiceItem[];
  dueDate: string;
  notes: string;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultData: InvoiceFormData = {
  branchId: "",
  customerId: "",
  items: [{ description: "", qty: 1, price: 0, total: 0 }],
  dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  notes: "",
};

export function InvoiceFormDialog({ open, onClose, onSuccess }: InvoiceFormDialogProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (open) {
      setFormData({ ...defaultData });
      setError("");
      loadDropdowns();
    }
  }, [open]);

  const loadDropdowns = async () => {
    try {
      const [b, c] = await Promise.all([
        getAvailableBranches(),
        getCustomersForDropdown()
      ]);
      setBranches(b);
      setCustomers(c);
      if (b.length > 0) setFormData(prev => ({ ...prev, branchId: b[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate total for item
    if (field === 'qty' || field === 'price') {
      newItems[index].total = newItems[index].qty * newItems[index].price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", qty: 1, price: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // Configurable if needed
  const total = subtotal + tax;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.branchId) return setError("กรุณาเลือกสาขา");
    if (!formData.customerId) return setError("กรุณาเลือกลูกค้า");
    if (formData.items.length === 0 || !formData.items[0].description) return setError("กรุณาระบุรายการอย่างน้อย 1 รายการ");

    setSubmitting(true);
    try {
      await createInvoice({
        branchId: formData.branchId,
        customerId: formData.customerId,
        items: formData.items,
        subtotal,
        tax,
        total,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        notes: formData.notes,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">สร้างใบแจ้งหนี้ / บิลเรียกเก็บเงิน</h2>
              <p className="text-[12px] text-text-muted">รายละเอียดรายการที่ต้องการเรียกเก็บเงินจากลูกค้า</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3.5 w-3.5" /> สาขา <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- เลือกสาขา --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5" /> ลูกค้า / ผู้เช่า <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">รายการเรียกเก็บเงิน</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="text-[12px] font-bold text-primary flex items-center gap-1 hover:bg-primary-light px-2 py-1 rounded-md transition-colors"
              >
                <Plus className="h-3 w-3" /> เพิ่มรายการ
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 border-b border-border text-[12px] font-semibold text-text-secondary">
                <div className="col-span-6">รายละเอียด</div>
                <div className="col-span-2 text-center">จำนวน</div>
                <div className="col-span-3 text-right">ราคา/หน่วย</div>
                <div className="col-span-1"></div>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 border-b border-border last:border-0 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="เช่น ค่าเช่าห้องเดือน ต.ค., ค่าน้ำ"
                      className="w-full rounded border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.qty === 0 ? "" : item.qty}
                      onChange={(e) => handleItemChange(index, "qty", e.target.value === "" ? 0 : Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      className="w-full rounded border border-border px-2 py-1.5 text-sm text-center focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={item.price === 0 ? "" : item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value === "" ? 0 : Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      className="w-full rounded border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                      disabled={formData.items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-semibold">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-blue-600 border-t border-border pt-2">
                  <span>ยอดสุทธิ (Total):</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ครบกำหนดชำระ (Due Date)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หมายเหตุท้ายบิล</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="เช่น กรุณาชำระภายในวันที่กำหนด"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

        </div>

        <div className="border-t border-border bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-red-500 font-medium">{error}</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              สร้างใบแจ้งหนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
