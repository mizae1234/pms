"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  Wrench, Plus, Loader2, Search, Filter, 
  AlertTriangle, MoreVertical, Edit2, Trash2, CheckCircle2
} from "lucide-react";
import { getMaintenanceTickets, deleteMaintenanceTicket, updateMaintenanceTicket } from "@/app/actions/maintenance";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { TicketFormDialog, TicketFormData } from "@/components/maintenance/ticket-form-dialog";

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketFormData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getMaintenanceTickets(targetBranch, statusFilter || undefined);
        setTickets(data);
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อม "${title}"?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteMaintenanceTicket(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleEdit = (ticket: any) => {
    setEditingTicket({
      id: ticket.id,
      roomId: ticket.roomId,
      title: ticket.title,
      description: ticket.description || "",
      priority: ticket.priority,
      status: ticket.status,
      cost: ticket.cost || 0,
    });
    setIsDialogOpen(true);
  };

  const quickResolve = async (id: string) => {
    try {
      await updateMaintenanceTicket(id, { status: "RESOLVED" });
      loadData();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[11px] font-bold">รอดำเนินการ</span>;
      case "IN_PROGRESS": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[11px] font-bold">กำลังซ่อม</span>;
      case "RESOLVED": return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[11px] font-bold">แก้ไขแล้ว</span>;
      case "CLOSED": return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[11px] font-bold">ปิดงาน</span>;
      default: return null;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "HIGH": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "MEDIUM": return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      case "LOW": return <div className="h-2 w-2 rounded-full bg-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="แจ้งซ่อม (Maintenance)" subtitle="จัดการงานช่างและบำรุงรักษาห้องพัก" />

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
              <option value="OPEN">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังซ่อม</option>
              <option value="RESOLVED">แก้ไขแล้ว</option>
              <option value="CLOSED">ปิดงาน</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditingTicket(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            เปิดแจ้งซ่อมใหม่
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบรายการแจ้งซ่อม</h3>
              <p className="text-sm text-text-muted">
                {statusFilter ? "ไม่มีรายการที่ตรงกับสถานะที่เลือก" : "ระบบปกติดี ไม่มีห้องพักที่ต้องซ่อมแซม"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">ห้องพัก</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">รายละเอียดปัญหา</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">วันที่แจ้ง</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            ticket.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 
                            ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.room.number}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                              ห้อง {ticket.room.number}
                            </div>
                            <div className="text-[11px] text-text-muted mt-0.5">
                              {ticket.room.branch.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getPriorityIcon(ticket.priority)}</div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{ticket.title}</div>
                            {ticket.description && (
                              <div className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">{ticket.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary">
                          {new Date(ticket.createdAt).toLocaleDateString("th-TH", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          แจ้งโดย: {ticket.reportedBy?.name || "ระบบ"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                            <button
                              onClick={() => quickResolve(ticket.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-emerald-200 bg-white shadow-sm flex items-center gap-1"
                              title="ทำเครื่องหมายว่าแก้ไขแล้ว"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-[11px] font-bold px-1 hidden sm:inline">แก้แล้ว</span>
                            </button>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(ticket)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors"
                              title="อัปเดต"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ticket.id, ticket.title)}
                              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      <TicketFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingTicket}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
