"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, User, Phone, Mail, MapPin, CreditCard, Flag } from "lucide-react";
import { createCustomer, updateCustomer } from "@/app/actions/customers";

export interface CustomerFormData {
  id?: string;
  name: string;
  idCard: string;
  passport: string;
  phone: string;
  email: string;
  nationality: string;
  address: string;
  notes: string;
}

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: CustomerFormData | null;
  onSuccess: () => void;
}

const defaultData: CustomerFormData = {
  name: "",
  idCard: "",
  passport: "",
  phone: "",
  email: "",
  nationality: "TH",
  address: "",
  notes: "",
};

export function CustomerFormDialog({ open, onClose, initialData, onSuccess }: CustomerFormDialogProps) {
  const [formData, setFormData] = useState<CustomerFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData(initialData ? { ...initialData } : { ...defaultData });
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("กรุณาระบุชื่อลูกค้า");
      return;
    }

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateCustomer(formData.id, formData);
      } else {
        await createCustomer(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, icon: Icon, value, onChange, placeholder, required }: any) => (
    <div>
      <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-text-muted" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {formData.id ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
              </h2>
              <p className="text-[12px] text-text-muted">กรอกรายละเอียดข้อมูลลูกค้าให้ครบถ้วน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Section 1: Basic Info */}
            <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">ข้อมูลส่วนตัว</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="ชื่อ-นามสกุล / ชื่อบริษัท"
                  icon={User}
                  value={formData.name}
                  onChange={(v: string) => setFormData({ ...formData, name: v })}
                  placeholder="เช่น สมชาย ใจดี"
                  required
                />
                <Field
                  label="สัญชาติ"
                  icon={Flag}
                  value={formData.nationality}
                  onChange={(v: string) => setFormData({ ...formData, nationality: v })}
                  placeholder="เช่น TH, EN"
                />
                <Field
                  label="เลขบัตรประชาชน"
                  icon={CreditCard}
                  value={formData.idCard}
                  onChange={(v: string) => setFormData({ ...formData, idCard: v })}
                  placeholder="1-1234-56789-01-2"
                />
                <Field
                  label="หนังสือเดินทาง (Passport)"
                  icon={CreditCard}
                  value={formData.passport}
                  onChange={(v: string) => setFormData({ ...formData, passport: v })}
                  placeholder="ถ้ามี"
                />
              </div>
            </div>

            {/* Section 2: Contact */}
            <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">ข้อมูลติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="เบอร์โทรศัพท์"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(v: string) => setFormData({ ...formData, phone: v })}
                  placeholder="08X-XXX-XXXX"
                />
                <Field
                  label="อีเมล"
                  icon={Mail}
                  value={formData.email}
                  onChange={(v: string) => setFormData({ ...formData, email: v })}
                  placeholder="email@example.com"
                />
                <div className="md:col-span-2">
                  <Field
                    label="ที่อยู่"
                    icon={MapPin}
                    value={formData.address}
                    onChange={(v: string) => setFormData({ ...formData, address: v })}
                    placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Notes */}
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                หมายเหตุ / ข้อมูลเพิ่มเติม
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ระบุข้อมูลเพิ่มเติมเกี่ยวกับลูกค้า..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50 resize-none"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
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
              {formData.id ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
