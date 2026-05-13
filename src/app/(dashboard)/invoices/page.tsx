"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  FileText, Plus, Loader2, Search, Trash2, 
  CheckCircle2, AlertCircle, Clock, CreditCard
} from "lucide-react";
import { getInvoices, deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { PaymentFormDialog } from "@/components/invoices/payment-form-dialog";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Dialogs
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getInvoices(targetBranch, statusFilter || undefined);
        setInvoices(data);
      } else {
        setInvoices([]);
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

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งหนี้ ${number}?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteInvoice(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateInvoiceStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleOpenPayment = (invoice: any) => {
    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const amountDue = Math.max(0, invoice.total - totalPaid);
    
    setPaymentTarget({
      id: invoice.id,
      number: invoice.number,
      customerName: invoice.customer.name,
      amountDue
    });
    setIsPaymentOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max">ร่าง (Draft)</span>;
      case "SENT": return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max">ส่งแล้ว (Sent)</span>;
      case "PARTIALLY_PAID": return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><Clock className="h-3 w-3" /> จ่ายบางส่วน</span>;
      case "PAID": return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><CheckCircle2 className="h-3 w-3" /> จ่ายครบแล้ว</span>;
      case "OVERDUE": return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><AlertCircle className="h-3 w-3" /> เกินกำหนด</span>;
      default: return null;
    }
  };

  const filteredData = invoices.filter(i => 
    i.number.toLowerCase().includes(search.toLowerCase()) || 
    i.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="บิลและใบแจ้งหนี้ (Invoices)" subtitle="สร้างบิลเรียกเก็บเงิน และจัดการสถานะการชำระเงิน" />

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
              <option value="DRAFT">ร่าง (Draft)</option>
              <option value="SENT">ส่งแล้ว (Sent)</option>
              <option value="PAID">ชำระครบแล้ว (Paid)</option>
              <option value="PARTIALLY_PAID">ชำระบางส่วน</option>
              <option value="OVERDUE">เกินกำหนดชำระ</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่บิล หรือลูกค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={() => setIsInvoiceOpen(true)}
            disabled={!branchId}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            สร้างบิลแจ้งหนี้
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
              <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบใบแจ้งหนี้</h3>
              <p className="text-sm text-text-muted">
                {search || statusFilter ? "ไม่มีบิลที่ตรงกับเงื่อนไขการค้นหา" : "คุณสามารถสร้างใบแจ้งหนี้เพื่อเรียกเก็บเงินได้ที่ปุ่มด้านบน"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">เลขที่บิล</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ครบกำหนด</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ยอดรวมสุทธิ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((invoice) => {
                    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                    const isFullyPaid = invoice.status === "PAID";
                    
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-blue-600">{invoice.number}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            ออกเมื่อ: {new Date(invoice.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-text-primary">{invoice.customer.name}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{invoice.branch.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-text-secondary">
                            {invoice.dueDate 
                              ? new Date(invoice.dueDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-text-primary">฿{invoice.total.toLocaleString()}</div>
                          {totalPaid > 0 && !isFullyPaid && (
                            <div className="text-[11px] font-medium text-emerald-600 mt-0.5">จ่ายแล้ว ฿{totalPaid.toLocaleString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isFullyPaid && (
                              <button
                                onClick={() => handleOpenPayment(invoice)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[12px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                title="รับชำระเงิน"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">รับชำระ</span>
                              </button>
                            )}
                            
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {invoice.status === "DRAFT" && (
                                <button
                                  onClick={() => handleStatusChange(invoice.id, "SENT")}
                                  className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-[11px] font-medium"
                                >
                                  ทำเครื่องหมายว่าส่งแล้ว
                                </button>
                              )}
                              
                              {invoice.payments.length === 0 && (
                                <button
                                  onClick={() => handleDelete(invoice.id, invoice.number)}
                                  className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
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

      <InvoiceFormDialog
        open={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        onSuccess={() => {
          setIsInvoiceOpen(false);
          loadData();
        }}
      />

      <PaymentFormDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        invoiceTarget={paymentTarget}
        onSuccess={() => {
          setIsPaymentOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
