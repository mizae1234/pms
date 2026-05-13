"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { bulkCreateRooms, getExistingRooms, type RoomConfig } from "@/app/actions/settings";

const roomTypeOptions = [
  { value: "STANDARD", label: "Standard" },
  { value: "DELUXE", label: "Deluxe" },
  { value: "SUITE", label: "Suite" },
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" },
  { value: "TWO_BED", label: "2 Bedroom" },
  { value: "PENTHOUSE", label: "Penthouse" },
];

const rentalModeOptions = [
  { value: "DAILY", label: "รายวัน" },
  { value: "MONTHLY", label: "รายเดือน" },
  { value: "FLEXIBLE", label: "Flexible" },
];

interface FloorSetup {
  floor: number;
  roomCount: number;
  roomType: string;
  rentalMode: string;
}

interface RoomSetup extends RoomConfig {
  // extends RoomConfig from actions
}

export default function RoomSetupWizard() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [step, setStep] = useState(0); // 0=select branch, 1=floors, 2=rooms, 3=summary
  const [floorCount, setFloorCount] = useState(3);
  const [floors, setFloors] = useState<FloorSetup[]>([]);
  const [rooms, setRooms] = useState<RoomSetup[]>([]);
  const [existingRooms, setExistingRooms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableBranches().then(setBranches).finally(() => setLoading(false));
  }, []);

  const loadExistingRooms = useCallback(async (bid: string) => {
    const existing = await getExistingRooms(bid);
    setExistingRooms(existing.map(r => r.number));
  }, []);

  // Step 0 → 1: Initialize floor configs
  const initFloors = () => {
    if (!branchId) return alert("กรุณาเลือกสาขา");
    loadExistingRooms(branchId);
    const arr: FloorSetup[] = [];
    for (let i = 1; i <= floorCount; i++) {
      arr.push({ floor: i, roomCount: 5, roomType: "STANDARD", rentalMode: "DAILY" });
    }
    setFloors(arr);
    setStep(1);
  };

  // Step 1 → 2: Generate room list from floor config
  const generateRooms = () => {
    const generated: RoomSetup[] = [];
    for (const f of floors) {
      for (let i = 1; i <= f.roomCount; i++) {
        const num = `${f.floor}${String(i).padStart(2, "0")}`;
        const isMonthly = f.rentalMode === "MONTHLY";
        generated.push({
          number: num,
          floor: f.floor,
          type: f.roomType,
          rentalMode: f.rentalMode,
          basePrice: isMonthly ? 0 : 1500,
          monthlyRate: f.rentalMode !== "DAILY" ? 15000 : null,
        });
      }
    }
    setRooms(generated);
    setStep(2);
  };

  // Step 2 → 3: Go to summary
  const goToSummary = () => setStep(3);

  // Step 3: Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await bulkCreateRooms(branchId, rooms);
      setResult(res);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk set price for a floor
  const bulkSetFloorPrice = (floor: number, field: "basePrice" | "monthlyRate", value: number) => {
    setRooms(prev => prev.map(r => r.floor === floor ? { ...r, [field]: value } : r));
  };

  // Bulk set type for a floor
  const bulkSetFloorField = (floor: number, field: "type" | "rentalMode", value: string) => {
    setRooms(prev => prev.map(r => {
      if (r.floor !== floor) return r;
      const updated = { ...r, [field]: value };
      if (field === "rentalMode") {
        if (value === "DAILY") updated.monthlyRate = null;
        else if (value === "MONTHLY") { updated.monthlyRate = updated.monthlyRate || 15000; updated.basePrice = 0; }
        else { updated.monthlyRate = updated.monthlyRate || 15000; }
      }
      return updated;
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Success state
  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-emerald-800 mb-2">สร้างห้องเรียบร้อย!</h3>
          <p className="text-sm text-emerald-700">{result.message}</p>
          <button onClick={() => { setResult(null); setStep(0); setRooms([]); setFloors([]); }} className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
            ตั้งค่าสาขาอื่น
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["เลือกสาขา", "โครงสร้างชั้น", "กำหนดห้อง", "ยืนยัน"].map((label, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={`h-px w-8 ${i <= step ? "bg-primary" : "bg-border"}`} />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${
              i === step ? "bg-primary text-white" : i < step ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-muted"
            }`}>
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              {label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Select Branch */}
      {step === 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-card p-8 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-text-primary mb-1">เลือกสาขา</h3>
          <p className="text-sm text-text-muted mb-6">เลือกสาขาที่ต้องการตั้งค่าห้องพัก</p>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4">
            <option value="">-- เลือกสาขา --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div>
            <label className="text-sm font-medium text-text-secondary">จำนวนชั้น</label>
            <input type="number" onFocus={(e) => e.target.select()} min={1} max={50} value={floorCount} onChange={(e) => setFloorCount((e.target.value === "" ? "" as any : Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button onClick={initFloors} disabled={!branchId} className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            ถัดไป <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: Floor Structure */}
      {step === 1 && (
        <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="bg-gray-50/70 px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary">กำหนดโครงสร้างชั้น</h3>
            <p className="text-sm text-text-muted mt-0.5">กำหนดจำนวนห้อง, ประเภท, และโหมดเช่าสำหรับแต่ละชั้น</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">ชั้น</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">จำนวนห้อง</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">ประเภทห้อง (Default)</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">โหมดเช่า (Default)</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Prefix</th>
                  </tr>
                </thead>
                <tbody>
                  {floors.map((f, i) => (
                    <tr key={f.floor} className="border-b border-border/50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">ชั้น {f.floor}</td>
                      <td className="py-2.5 px-3">
                        <input type="number" onFocus={(e) => e.target.select()} min={1} max={99} value={f.roomCount} onChange={(e) => { const v = [...floors]; v[i].roomCount = (e.target.value === "" ? "" as any : Number(e.target.value)); setFloors(v); }} className="w-20 rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none" />
                      </td>
                      <td className="py-2.5 px-3">
                        <select value={f.roomType} onChange={(e) => { const v = [...floors]; v[i].roomType = e.target.value; setFloors(v); }} className="rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none">
                          {roomTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select value={f.rentalMode} onChange={(e) => { const v = [...floors]; v[i].rentalMode = e.target.value; setFloors(v); }} className="rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none">
                          {rentalModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono">{f.floor}01 – {f.floor}{String(f.roomCount).padStart(2, "0")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-sm text-text-muted">
                รวม: <span className="font-bold text-text-primary">{floors.reduce((s, f) => s + f.roomCount, 0)}</span> ห้อง
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                </button>
                <button onClick={generateRooms} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
                  ถัดไป <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Room Details */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Group rooms by floor */}
          {Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b).map(floor => {
            const floorRooms = rooms.filter(r => r.floor === floor);
            return (
              <div key={floor} className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
                <div className="bg-gray-50/70 px-6 py-3 border-b border-border flex items-center justify-between">
                  <h4 className="text-sm font-bold text-text-primary">ชั้น {floor} <span className="text-text-muted font-normal">({floorRooms.length} ห้อง)</span></h4>
                  <div className="flex items-center gap-2">
                    <select onChange={(e) => { if (e.target.value) bulkSetFloorField(floor, "type", e.target.value); e.target.value = ""; }} className="rounded-md border border-border px-2 py-1 text-[12px] focus:outline-none" defaultValue="">
                      <option value="" disabled>เปลี่ยนประเภททั้งชั้น</option>
                      {roomTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select onChange={(e) => { if (e.target.value) bulkSetFloorField(floor, "rentalMode", e.target.value); e.target.value = ""; }} className="rounded-md border border-border px-2 py-1 text-[12px] focus:outline-none" defaultValue="">
                      <option value="" disabled>เปลี่ยนโหมดทั้งชั้น</option>
                      {rentalModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => {
                      const p = prompt("ใส่ราคา/คืน สำหรับทุกห้องในชั้นนี้:");
                      if (p) bulkSetFloorPrice(floor, "basePrice", Number(p));
                    }} className="rounded-md border border-border px-2 py-1 text-[12px] hover:bg-gray-50">💰 ราคาทั้งชั้น</button>
                  </div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium w-24">เลขห้อง</th>
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium">ประเภท</th>
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium">โหมดเช่า</th>
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium">ราคา/คืน (฿)</th>
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium">ราคา/เดือน (฿)</th>
                        <th className="text-left py-1.5 px-2 text-[11px] text-text-muted font-medium w-16">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorRooms.map((room, ri) => {
                        const idx = rooms.findIndex(r => r.number === room.number && r.floor === room.floor);
                        const exists = existingRooms.includes(room.number);
                        return (
                          <tr key={room.number} className={`border-b border-border/30 ${exists ? "bg-amber-50/50" : "hover:bg-gray-50/50"}`}>
                            <td className="py-1.5 px-2">
                              <input value={room.number} onChange={(e) => { const v = [...rooms]; v[idx].number = e.target.value; setRooms(v); }} className="w-20 rounded-md border border-border px-2 py-1 text-sm font-mono focus:border-primary focus:outline-none" />
                            </td>
                            <td className="py-1.5 px-2">
                              <select value={room.type} onChange={(e) => { const v = [...rooms]; v[idx].type = e.target.value; setRooms(v); }} className="rounded-md border border-border px-2 py-1 text-sm focus:outline-none">
                                {roomTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select value={room.rentalMode} onChange={(e) => {
                                const v = [...rooms]; v[idx].rentalMode = e.target.value;
                                if (e.target.value === "DAILY") v[idx].monthlyRate = null;
                                else if (e.target.value === "MONTHLY") { v[idx].monthlyRate = v[idx].monthlyRate || 15000; v[idx].basePrice = 0; }
                                else { v[idx].monthlyRate = v[idx].monthlyRate || 15000; }
                                setRooms(v);
                              }} className="rounded-md border border-border px-2 py-1 text-sm focus:outline-none">
                                {rentalModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              {room.rentalMode !== "MONTHLY" ? (
                                <input type="number" onFocus={(e) => e.target.select()} value={room.basePrice} onChange={(e) => { const v = [...rooms]; v[idx].basePrice = (e.target.value === "" ? "" as any : Number(e.target.value)); setRooms(v); }} className="w-24 rounded-md border border-border px-2 py-1 text-sm text-right focus:border-primary focus:outline-none" />
                              ) : <span className="text-text-muted text-[12px]">—</span>}
                            </td>
                            <td className="py-1.5 px-2">
                              {room.rentalMode !== "DAILY" ? (
                                <input type="number" onFocus={(e) => e.target.select()} value={room.monthlyRate || 0} onChange={(e) => { const v = [...rooms]; v[idx].monthlyRate = (e.target.value === "" ? "" as any : Number(e.target.value)); setRooms(v); }} className="w-24 rounded-md border border-border px-2 py-1 text-sm text-right focus:border-primary focus:outline-none" />
                              ) : <span className="text-text-muted text-[12px]">—</span>}
                            </td>
                            <td className="py-1.5 px-2">
                              {exists ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium"><AlertCircle className="h-3 w-3" />มีแล้ว</span>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-medium">ใหม่</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-text-muted">
              รวม: <span className="font-bold text-text-primary">{rooms.length}</span> ห้อง
              {existingRooms.length > 0 && <span className="text-amber-600 ml-2">({rooms.filter(r => existingRooms.includes(r.number)).length} มีอยู่แล้ว — จะข้าม)</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
              </button>
              <button onClick={goToSummary} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
                ถัดไป <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl border border-border bg-surface shadow-card p-8">
            <h3 className="text-lg font-bold text-text-primary mb-4">สรุปและยืนยัน</h3>
            <div className="space-y-4 mb-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-[11px] text-text-muted uppercase font-medium mb-2">ข้อมูลทั่วไป</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-text-muted">สาขา:</span>
                  <span className="font-semibold">{branches.find(b => b.id === branchId)?.name}</span>
                  <span className="text-text-muted">จำนวนชั้น:</span>
                  <span className="font-semibold">{new Set(rooms.map(r => r.floor)).size} ชั้น</span>
                  <span className="text-text-muted">จำนวนห้องทั้งหมด:</span>
                  <span className="font-semibold">{rooms.length} ห้อง</span>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-[11px] text-blue-600 uppercase font-medium mb-2">แบ่งตามโหมดเช่า</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>🏨 Daily (รายวัน)</span><span className="font-semibold">{rooms.filter(r => r.rentalMode === "DAILY").length} ห้อง</span></div>
                  <div className="flex justify-between"><span>🏠 Monthly (รายเดือน)</span><span className="font-semibold">{rooms.filter(r => r.rentalMode === "MONTHLY").length} ห้อง</span></div>
                  <div className="flex justify-between"><span>🔄 Flexible</span><span className="font-semibold">{rooms.filter(r => r.rentalMode === "FLEXIBLE").length} ห้อง</span></div>
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="text-[11px] text-purple-600 uppercase font-medium mb-2">แบ่งตามประเภท</div>
                <div className="space-y-1 text-sm">
                  {roomTypeOptions.filter(o => rooms.some(r => r.type === o.value)).map(o => (
                    <div key={o.value} className="flex justify-between">
                      <span>{o.label}</span>
                      <span className="font-semibold">{rooms.filter(r => r.type === o.value).length} ห้อง</span>
                    </div>
                  ))}
                </div>
              </div>
              {rooms.filter(r => existingRooms.includes(r.number)).length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>{rooms.filter(r => existingRooms.includes(r.number)).length} ห้องมีอยู่แล้ว — จะถูกข้ามไม่สร้างซ้ำ</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" /> แก้ไข
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> บันทึกทั้งหมด</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

