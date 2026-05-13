"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Users, Search, Plus, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { getCustomers, deleteCustomer } from "@/app/actions/customers";
import { CustomerFormDialog, CustomerFormData } from "@/components/customers/customer-form-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า "${name}"?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteCustomer(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบลูกค้า");
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      idCard: customer.idCard || "",
      passport: customer.passport || "",
      phone: customer.phone || "",
      email: customer.email || "",
      nationality: customer.nationality || "TH",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <Header title="ลูกค้า" subtitle="จัดการข้อมูลลูกค้าและประวัติการจอง" />

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, บัตรประชาชน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            เพิ่มลูกค้าใหม่
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบข้อมูลลูกค้า</h3>
              <p className="text-sm text-text-muted">
                {search ? "ไม่มีลูกค้าที่ตรงกับการค้นหาของคุณ" : "ยังไม่มีข้อมูลลูกค้าในระบบ"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ชื่อลูกค้า</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ข้อมูลติดต่อ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-center">ประวัติ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary text-sm">
                              {customer.name}
                              {customer.nationality && customer.nationality !== "TH" && (
                                <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-text-muted">
                                  {customer.nationality}
                                </span>
                              )}
                            </div>
                            {customer.idCard && (
                              <div className="text-[11px] text-text-muted mt-0.5 font-mono">
                                ID: {customer.idCard}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary flex flex-col gap-0.5">
                          {customer.phone && <span>📞 {customer.phone}</span>}
                          {customer.email && <span>✉️ {customer.email}</span>}
                          {!customer.phone && !customer.email && <span className="text-text-muted/50">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-medium flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-bold">{customer._count.bookings}</span>
                            <span className="text-[9px] uppercase">การจอง</span>
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-medium flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-bold">{customer._count.contracts}</span>
                            <span className="text-[9px] uppercase">สัญญา</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            disabled={customer._count.bookings > 0 || customer._count.contracts > 0}
                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                            title={customer._count.bookings > 0 || customer._count.contracts > 0 ? "ไม่สามารถลบได้ (มีประวัติ)" : "ลบ"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <CustomerFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingCustomer}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
