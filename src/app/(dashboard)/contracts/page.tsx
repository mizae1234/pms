"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  FileText, Plus, Loader2, Search, Edit2, Trash2, 
  Calendar, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { getContracts, deleteContract } from "@/app/actions/contracts";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { ContractFormDialog, ContractFormData } from "@/components/contracts/contract-form-dialog";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractFormData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getContracts(targetBranch, statusFilter || undefined);
        setContracts(data);
      } else {
        setContracts([]);
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

  const handleDelete = async (id: string, roomNum: string, customer: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสัญญาเช่าห้อง ${roomNum} ของคุณ ${customer}?\n* มัดจำที่ผูกกับสัญญานี้จะถูกลบไปด้วย\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteContract(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleEdit = (contract: any) => {
    setEditingContract({
      id: contract.id,
      roomId: contract.roomId,
      customerId: contract.customerId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      monthlyRent: contract.monthlyRent,
      depositAmount: 0, // Not used in edit mode
      status: contract.status,
      terms: contract.terms || "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><CheckCircle2 className="h-3 w-3" /> ใช้งานอยู่</span>;
      case "PENDING": return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><Calendar className="h-3 w-3" /> รอเริ่มต้น</span>;
      case "EXPIRED": return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><AlertCircle className="h-3 w-3" /> หมดสัญญา</span>;
      case "TERMINATED": return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max"><XCircle className="h-3 w-3" /> ยกเลิก</span>;
      default: return null;
    }
  };

  const filteredData = contracts.filter(c => 
    c.room.number.toLowerCase().includes(search.toLowerCase()) || 
    c.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="สัญญาเช่า (Contracts)" subtitle="จัดการสัญญาเช่ารายเดือนและประวัติผู้เช่า" />

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
              <option value="ACTIVE">ใช้งานอยู่ (Active)</option>
              <option value="PENDING">รอเริ่มต้น (Pending)</option>
              <option value="EXPIRED">หมดสัญญา (Expired)</option>
              <option value="TERMINATED">ยกเลิก (Terminated)</option>
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

          <button
            onClick={() => {
              setEditingContract(null);
              setIsDialogOpen(true);
            }}
            disabled={!branchId}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            สร้างสัญญาใหม่
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
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบสัญญาเช่า</h3>
              <p className="text-sm text-text-muted">
                {search || statusFilter ? "ไม่มีสัญญาที่ตรงกับเงื่อนไข" : "ยังไม่มีสัญญาเช่าในสาขานี้"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ห้องพัก</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ผู้เช่า</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ระยะเวลาสัญญา</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">ค่าเช่า/เดือน</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-base text-text-primary">ห้อง {contract.room.number}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">{contract.room.branch.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-text-primary">{contract.customer.name}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">{contract.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-secondary">
                          {new Date(contract.startDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} 
                          {" - "}
                          {new Date(contract.endDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        {contract.status === "ACTIVE" && new Date(contract.endDate) < new Date(new Date().setMonth(new Date().getMonth() + 1)) && (
                          <div className="text-[11px] font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> ใกล้หมดสัญญา
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-sm text-emerald-600">฿{contract.monthlyRent.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(contract)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id, contract.room.number, contract.customer.name)}
                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="ลบสัญญา"
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

      <ContractFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingContract}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
