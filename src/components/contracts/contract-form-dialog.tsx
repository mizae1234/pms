"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, FileText, Calendar, Building2, User, DollarSign } from "lucide-react";
import { createContract, updateContract } from "@/app/actions/contracts";
import { getRoomsForDropdown, getCustomersForDropdown } from "@/app/actions/booking-helpers";

export interface ContractFormData {
  id?: string;
  roomId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number; // Only for creation
  status?: "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING";
  terms: string;
}

interface ContractFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: ContractFormData | null;
  onSuccess: () => void;
}

const defaultData: ContractFormData = {
  roomId: "",
  customerId: "",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  monthlyRent: 0,
  depositAmount: 0,
  terms: "",
};

export function ContractFormDialog({ open, onClose, initialData, onSuccess }: ContractFormDialogProps) {
  const [formData, setFormData] = useState<ContractFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [rooms, setRooms] = useState<{id: string, label: string}[]>([]);
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          startDate: new Date(initialData.startDate).toISOString().split('T')[0],
          endDate: new Date(initialData.endDate).toISOString().split('T')[0],
        });
      } else {
        setFormData({ ...defaultData });
      }
      setError("");
      loadDropdowns();
    }
  }, [open, initialData]);

  const loadDropdowns = async () => {
    try {
      const [r, c] = await Promise.all([
        getRoomsForDropdown(),
        getCustomersForDropdown()
      ]);
      setRooms(r);
      setCustomers(c);
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.roomId) return setError("กรุณาเลือกห้องพัก");
    if (!formData.customerId) return setError("กรุณาเลือกลูกค้า");
    if (!formData.startDate || !formData.endDate) return setError("กรุณาระบุวันที่เริ่มและสิ้นสุดสัญญา");

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateContract(formData.id, {
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          monthlyRent: formData.monthlyRent,
          terms: formData.terms,
          status: formData.status as any,
        });
      } else {
        await createContract({
          roomId: formData.roomId,
          customerId: formData.customerId,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          monthlyRent: formData.monthlyRent,
          depositAmount: formData.depositAmount,
          terms: formData.terms,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {formData.id ? "แก้ไขสัญญาเช่า" : "ทำสัญญาเช่าใหม่"}
              </h2>
              <p className="text-[12px] text-text-muted">รายละเอียดสัญญาและค่าเช่าล่วงหน้า</p>
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
                <Building2 className="h-3.5 w-3.5" /> ห้องพัก <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                disabled={!!formData.id}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
              >
                <option value="">-- เลือกห้องพัก --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5" /> ผู้เช่า <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                disabled={!!formData.id}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> วันที่เริ่มสัญญา <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> วันสิ้นสุดสัญญา <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div>
              <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3.5 w-3.5" /> ค่าเช่ารายเดือน <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                onFocus={e => e.target.select()}
                value={formData.monthlyRent === 0 ? "" : formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-right font-bold text-emerald-700"
              />
            </div>
            {!formData.id && (
              <div>
                <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> เงินประกัน/มัดจำแรกเข้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  onFocus={e => e.target.select()}
                  value={formData.depositAmount === 0 ? "" : formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-right font-bold text-emerald-700"
                />
              </div>
            )}
          </div>

          {formData.id && (
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">สถานะสัญญา</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ACTIVE">มีผลใช้งาน (Active)</option>
                <option value="PENDING">รอเซ็นสัญญา (Pending)</option>
                <option value="EXPIRED">หมดสัญญา (Expired)</option>
                <option value="TERMINATED">ยกเลิก/สิ้นสุดก่อนกำหนด (Terminated)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">เงื่อนไขเพิ่มเติม / หมายเหตุ</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
              placeholder="ข้อตกลงพิเศษ หรือเงื่อนไขเพิ่มเติมในสัญญา..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
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
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {formData.id ? "บันทึกข้อมูล" : "สร้างสัญญาเช่า"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
