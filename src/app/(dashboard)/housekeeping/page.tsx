"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  CheckCircle2, Clock, PlayCircle, ClipboardList, Plus, 
  Calendar, Search, Loader2, RefreshCw, AlertCircle
} from "lucide-react";
import { getHousekeepingTasks, generateDailyTasks, updateHousekeepingTaskStatus } from "@/app/actions/housekeeping";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        const data = await getHousekeepingTasks(new Date(date), targetBranch);
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    if (!branchId) return;
    setGenerating(true);
    try {
      const count = await generateDailyTasks(branchId, new Date(date));
      if (count > 0) {
        alert(`สร้างงานทำความสะอาดสำเร็จ ${count} ห้อง`);
        loadData();
      } else {
        alert("ไม่มีห้องที่ต้องทำความสะอาดเพิ่มเติมในวันนี้");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
      await updateHousekeepingTaskStatus(taskId, status);
      loadData();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
      loadData();
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "PENDING");
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED");

  const TaskCard = ({ task }: { task: any }) => {
    return (
      <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
              task.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
              task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {task.room.number}
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">ห้อง {task.room.number}</div>
              <div className="text-[11px] text-text-muted">ชั้น {task.room.floor} • {task.room.status === "CLEANING" ? "รอกวาด/ถู" : task.room.status}</div>
            </div>
          </div>
          {task.priority === "HIGH" || task.priority === "URGENT" ? (
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">ด่วน</span>
          ) : null}
        </div>
        
        <div className="text-[12px] text-text-secondary mb-4 line-clamp-2 min-h-[36px]">
          {task.notes || "ทำความสะอาดประจำวัน / ทำความสะอาดหลัง Check-out"}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <div className="text-[11px] text-text-muted">
            {task.assignedTo ? task.assignedTo.name : "ยังไม่ระบุคนทำ"}
          </div>
          <div className="flex gap-2">
            {task.status === "PENDING" && (
              <button 
                onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <PlayCircle className="h-3.5 w-3.5" /> เริ่มงาน
              </button>
            )}
            {task.status === "IN_PROGRESS" && (
              <button 
                onClick={() => handleStatusChange(task.id, "COMPLETED")}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> เสร็จสิ้น
              </button>
            )}
            {(task.status === "COMPLETED" || task.status === "VERIFIED") && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> เรียบร้อย
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="แม่บ้าน (Housekeeping)" subtitle="จัดการตารางทำความสะอาดและตรวจสอบความเรียบร้อยของห้องพัก" />

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-text-muted" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleGenerate}
              disabled={generating || !branchId}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-border hover:bg-gray-50 text-text-primary px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {generating ? "กำลังสร้าง..." : "สร้างงานอัตโนมัติ"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            
            {/* Column 1: Pending */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-text-primary">รอดำเนินการ</h3>
                <span className="ml-auto bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[11px] font-bold">
                  {pendingTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-surface">
                    <p className="text-sm text-text-muted">ไม่มีงานรอดำเนินการ</p>
                  </div>
                ) : (
                  pendingTasks.map(task => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <PlayCircle className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-text-primary">กำลังทำความสะอาด</h3>
                <span className="ml-auto bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[11px] font-bold">
                  {inProgressTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {inProgressTasks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-surface">
                    <p className="text-sm text-text-muted">ไม่มีงานที่กำลังทำ</p>
                  </div>
                ) : (
                  inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-text-primary">เสร็จสิ้นแล้ว</h3>
                <span className="ml-auto bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-[11px] font-bold">
                  {completedTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-surface">
                    <p className="text-sm text-text-muted">ยังไม่มีงานที่เสร็จสิ้น</p>
                  </div>
                ) : (
                  completedTasks.map(task => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
