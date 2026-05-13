"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Receipt, FileText } from "lucide-react";
import { recordPayment } from "@/app/actions/payments";

export interface PaymentFormData {
  invoiceId?: string;
  bookingId?: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "QR_CODE" | "OTHER";
  referenceNo: string;
  notes: string;
}

interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceTarget?: { id: string, number: string, amountDue: number, customerName: string } | null;
  onSuccess: () => void;
}

const defaultData: PaymentFormData = {
  amount: 0,
  method: "BANK_TRANSFER",
  referenceNo: "",
  notes: "",
};

export function PaymentFormDialog({ open, onClose, invoiceTarget, onSuccess }: PaymentFormDialogProps) {
  const [formData, setFormData] = useState<PaymentFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        ...defaultData,
        invoiceId: invoiceTarget?.id,
        amount: invoiceTarget?.amountDue || 0
      });
      setError("");
    }
  }, [open, invoiceTarget]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.amount <= 0) return setError("ยอดรับชำระต้องมากกว่า 0");

    setSubmitting(true);
    try {
      await recordPayment({
        invoiceId: formData.invoiceId,
        bookingId: formData.bookingId,
        amount: formData.amount,
        method: formData.method,
        referenceNo: formData.referenceNo,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">รับชำระเงิน</h2>
              <p className="text-[12px] text-text-muted">บันทึกการรับชำระเงินจากลูกค้า</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {invoiceTarget && (
            <div className="bg-gray-50 border border-border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <FileText className="h-4 w-4" /> บิล: <span className="font-bold text-text-primary">{invoiceTarget.number}</span>
              </div>
              <div className="text-sm text-text-secondary">ลูกค้า: {invoiceTarget.customerName}</div>
              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <div className="text-sm font-medium">ยอดคงค้าง (Amount Due)</div>
                <div className="text-lg font-bold text-red-500">฿{invoiceTarget.amountDue.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
              ยอดรับชำระ (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              onFocus={e => e.target.select()}
              value={formData.amount === 0 ? "" : formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value === "" ? (0 as any) : Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-white px-3 py-3 text-lg font-bold text-emerald-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">ช่องทางชำระเงิน</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="BANK_TRANSFER">โอนเงิน (Transfer)</option>
                <option value="QR_CODE">สแกน QR</option>
                <option value="CASH">เงินสด (Cash)</option>
                <option value="CREDIT_CARD">บัตรเครดิต</option>
                <option value="OTHER">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">เลขอ้างอิง (ถ้ามี)</label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                placeholder="เช่น 123456"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              บันทึกรับชำระ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
