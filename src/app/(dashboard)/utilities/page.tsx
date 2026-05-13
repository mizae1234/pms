"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { 
  Loader2, Search, Save, Zap, Droplets, CheckCircle2, ChevronRight
} from "lucide-react";
import { getUtilityMeters, saveUtilityMeter } from "@/app/actions/utilities";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

export default function UtilitiesPage() {
  const [data, setData] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Local state for editing before save
  const [edits, setEdits] = useState<Record<string, any>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getAvailableBranches();
      setBranches(b);
      
      const targetBranch = branchId || (b.length > 0 ? b[0].id : "");
      if (!branchId && b.length > 0) setBranchId(b[0].id);

      if (targetBranch) {
        // periodMonth is YYYY-MM, we append -01
        const res = await getUtilityMeters(targetBranch, `${periodMonth}-01`);
        setData(res.records);
        setSettings(res.settings);
        
        // Initialize edits state with fetched data
        const initialEdits: Record<string, any> = {};
        res.records.forEach((r: any) => {
          initialEdits[`${r.room.id}_WATER`] = {
            previous: r.water.previous,
            current: r.water.current || "",
          };
          initialEdits[`${r.room.id}_ELECTRIC`] = {
            previous: r.electric.previous,
            current: r.electric.current || "",
          };
        });
        setEdits(initialEdits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId, periodMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditChange = (roomId: string, type: "WATER" | "ELECTRIC", field: "previous" | "current", value: string) => {
    const key = `${roomId}_${type}`;
    setEdits(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value === "" ? "" : Number(value)
      }
    }));
  };

  const handleSave = async (roomId: string, type: "WATER" | "ELECTRIC") => {
    const key = `${roomId}_${type}`;
    const editData = edits[key];
    
    if (editData.current === "" || editData.previous === "") {
      alert("กรุณากรอกตัวเลขให้ครบถ้วน");
      return;
    }
    
    if (Number(editData.current) < Number(editData.previous)) {
      if (!confirm("เลขมิเตอร์ปัจจุบัน น้อยกว่า เลขครั้งก่อน\nคุณแน่ใจหรือไม่ว่าต้องการบันทึก? (มิเตอร์อาจจะวนรอบ)")) {
        return;
      }
    }

    setSavingId(key);
    try {
      await saveUtilityMeter({
        roomId,
        meterType: type,
        periodMonthStr: `${periodMonth}-01`,
        previousReading: Number(editData.previous),
        currentReading: Number(editData.current)
      });
      
      // Update local data to show it's recorded
      setData(prev => prev.map(r => {
        if (r.room.id === roomId) {
          const field = type === "WATER" ? "water" : "electric";
          const unitUsed = Math.max(0, Number(editData.current) - Number(editData.previous));
          const rate = settings[`${field}Rate`];
          const minCharge = settings[`${field}Min`];
          const totalAmount = Math.max(unitUsed * rate, minCharge);
          
          return {
            ...r,
            [field]: {
              ...r[field],
              previous: Number(editData.previous),
              current: Number(editData.current),
              unitUsed,
              totalAmount,
              isRecorded: true
            }
          };
        }
        return r;
      }));
      
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSavingId(null);
    }
  };

  const filteredData = data.filter(r => 
    r.room.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full bg-gray-50/50">
      <Header title="มิเตอร์น้ำ-ไฟ (Utilities)" subtitle="จดเลขมิเตอร์และคำนวณค่าใช้จ่ายประจำเดือน" />

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
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
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="ค้นหาเลขห้อง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-gray-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-border shadow-sm p-6 text-center">
            <Droplets className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-1">ไม่พบข้อมูลห้องพัก</h3>
            <p className="text-sm text-text-muted">โปรดเลือกสาขาอื่น หรือค้นหาใหม่</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider w-32">ห้องพัก</th>
                    <th className="px-4 py-4 text-[12px] font-semibold text-blue-600 bg-blue-50/50 uppercase tracking-wider text-center border-l border-border">
                      <div className="flex items-center justify-center gap-1"><Droplets className="h-3.5 w-3.5" /> มิเตอร์น้ำ</div>
                    </th>
                    <th className="px-4 py-4 text-[12px] font-semibold text-amber-600 bg-amber-50/50 uppercase tracking-wider text-center border-l border-border">
                      <div className="flex items-center justify-center gap-1"><Zap className="h-3.5 w-3.5" /> มิเตอร์ไฟ</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((row) => {
                    const room = row.room;
                    const wKey = `${room.id}_WATER`;
                    const eKey = `${room.id}_ELECTRIC`;
                    
                    const MeterCell = ({ type, data, editData, recordKey, rate }: any) => {
                      const isSaving = savingId === recordKey;
                      const hasChanged = editData?.current !== "" && editData?.current != data.current;
                      
                      return (
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex flex-col gap-1 w-24">
                            <span className="text-[10px] text-text-muted leading-none">ครั้งก่อน</span>
                            <input 
                              type="number" 
                              value={editData?.previous === "" ? "" : editData?.previous}
                              onChange={(e) => handleEditChange(room.id, type, "previous", e.target.value)}
                              onFocus={e => e.target.select()}
                              className="w-full rounded border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="text-text-muted"><ChevronRight className="h-4 w-4" /></div>
                          <div className="flex flex-col gap-1 w-24">
                            <span className="text-[10px] text-text-muted leading-none font-semibold text-primary">จดใหม่</span>
                            <input 
                              type="number" 
                              value={editData?.current === "" ? "" : editData?.current}
                              onChange={(e) => handleEditChange(room.id, type, "current", e.target.value)}
                              onFocus={e => e.target.select()}
                              className={`w-full rounded border px-2 py-1.5 text-sm text-right font-bold focus:outline-none ${
                                data.isRecorded ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-500' : 'border-blue-300 bg-blue-50 focus:border-blue-500'
                              }`}
                              placeholder="0"
                            />
                          </div>
                          
                          <div className="flex-1 flex flex-col items-end pr-2">
                            {data.isRecorded && !hasChanged ? (
                              <>
                                <div className="text-[11px] font-medium text-text-secondary">{data.unitUsed} หน่วย</div>
                                <div className="text-sm font-bold text-text-primary">฿{data.totalAmount.toLocaleString()}</div>
                              </>
                            ) : (
                              <button
                                onClick={() => handleSave(room.id, type)}
                                disabled={isSaving || editData?.current === ""}
                                className={`h-8 px-3 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-colors ${
                                  hasChanged 
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                    : 'bg-primary text-white hover:bg-primary-hover disabled:bg-gray-100 disabled:text-gray-400'
                                }`}
                              >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 
                                 data.isRecorded ? <Save className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                                {hasChanged ? "อัปเดต" : "บันทึก"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 border-r border-border bg-white">
                          <div className="font-bold text-base text-text-primary">ห้อง {room.number}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">ชั้น {room.floor}</div>
                        </td>
                        <td className="px-4 py-4 border-r border-border">
                          <MeterCell 
                            type="WATER" 
                            data={row.water} 
                            editData={edits[wKey]} 
                            recordKey={wKey} 
                            rate={settings?.waterRate} 
                          />
                        </td>
                        <td className="px-4 py-4">
                          <MeterCell 
                            type="ELECTRIC" 
                            data={row.electric} 
                            editData={edits[eKey]} 
                            recordKey={eKey} 
                            rate={settings?.electricRate} 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
