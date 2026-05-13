"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, Copy } from "lucide-react";
import { getAvailableBranches } from "@/app/actions/booking-helpers";
import { getBranchSettings, updateBranchSettings, copyBranchSettings } from "@/app/actions/settings";

export default function RateSettings() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [copyFrom, setCopyFrom] = useState("");
  const [copySections, setCopySections] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Settings form state
  const [form, setForm] = useState({
    defaultCheckIn: "14:00", defaultCheckOut: "12:00",
    electricRate: 8, electricMin: 0,
    waterRate: 18, waterMin: 0, waterIsFlat: false, waterFlatAmount: null as number | null,
    billingDay: 25, dueDays: 10,
    securityDepositMonths: 2, advancePayMonths: 1,
    monthlyCleaningPerWeek: 1,
    commonFee: null as number | null, parkingFee: null as number | null, internetFee: null as number | null,
  });

  useEffect(() => {
    getAvailableBranches().then(b => { setBranches(b); if (b.length > 0) setBranchId(b[0].id); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    getBranchSettings(branchId).then(s => {
      setForm({
        defaultCheckIn: s.defaultCheckIn, defaultCheckOut: s.defaultCheckOut,
        electricRate: s.electricRate, electricMin: s.electricMin,
        waterRate: s.waterRate, waterMin: s.waterMin, waterIsFlat: s.waterIsFlat, waterFlatAmount: s.waterFlatAmount,
        billingDay: s.billingDay, dueDays: s.dueDays,
        securityDepositMonths: s.securityDepositMonths, advancePayMonths: s.advancePayMonths,
        monthlyCleaningPerWeek: s.monthlyCleaningPerWeek,
        commonFee: s.commonFee, parkingFee: s.parkingFee, internetFee: s.internetFee,
      });
    }).finally(() => setLoading(false));
  }, [branchId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBranchSettings(branchId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert("Error: " + (err instanceof Error ? err.message : "Unknown")); }
    finally { setSaving(false); }
  };

  const handleCopy = async () => {
    if (!copyFrom || copySections.length === 0) return alert("กรุณาเลือกสาขาต้นทางและรายการ");
    try {
      await copyBranchSettings(copyFrom, branchId, copySections);
      setShowCopy(false);
      // Reload settings
      const s = await getBranchSettings(branchId);
      setForm({
        defaultCheckIn: s.defaultCheckIn, defaultCheckOut: s.defaultCheckOut,
        electricRate: s.electricRate, electricMin: s.electricMin,
        waterRate: s.waterRate, waterMin: s.waterMin, waterIsFlat: s.waterIsFlat, waterFlatAmount: s.waterFlatAmount,
        billingDay: s.billingDay, dueDays: s.dueDays,
        securityDepositMonths: s.securityDepositMonths, advancePayMonths: s.advancePayMonths,
        monthlyCleaningPerWeek: s.monthlyCleaningPerWeek,
        commonFee: s.commonFee, parkingFee: s.parkingFee, internetFee: s.internetFee,
      });
    } catch (err) { alert("Error: " + (err instanceof Error ? err.message : "Unknown")); }
  };

  const toggleCopySection = (s: string) => setCopySections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  if (loading && !branchId) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/30">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Branch + Copy */}
      <div className="flex items-center gap-3">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button onClick={() => setShowCopy(true)} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors">
          <Copy className="h-4 w-4" /> คัดลอกจากสาขาอื่น
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Check-in/out Time */}
          <div className="rounded-xl border border-border bg-surface shadow-card p-6">
            <h4 className="text-sm font-bold text-text-primary mb-4">⏰ เวลา Check-in / Check-out</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-text-muted">Check-in เวลา</label>
                <input type="time" value={form.defaultCheckIn} onChange={e => setForm({ ...form, defaultCheckIn: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-muted">Check-out เวลา</label>
                <input type="time" value={form.defaultCheckOut} onChange={e => setForm({ ...form, defaultCheckOut: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Utility Rates */}
          <div className="rounded-xl border border-border bg-surface shadow-card p-6">
            <h4 className="text-sm font-bold text-text-primary mb-4">⚡ ค่าน้ำ-ไฟ</h4>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-muted uppercase mb-2">ค่าไฟฟ้า</div>
              <Field label="อัตราค่าไฟ (บาท/หน่วย)">
                <input type="number" onFocus={(e) => e.target.select()} step="0.5" value={form.electricRate} onChange={e => setForm({ ...form, electricRate: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
              </Field>
              <Field label="ค่าขั้นต่ำ (บาท/เดือน)">
                <input type="number" onFocus={(e) => e.target.select()} value={form.electricMin} onChange={e => setForm({ ...form, electricMin: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
                <span className="text-[11px] text-text-muted">(0 = ไม่มี)</span>
              </Field>
            </div>
            <div className="space-y-1 mt-4">
              <div className="text-[11px] font-semibold text-text-muted uppercase mb-2">ค่าน้ำประปา</div>
              <Field label="รูปแบบ">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={!form.waterIsFlat} onChange={() => setForm({ ...form, waterIsFlat: false })} className="accent-primary" />ตามมิเตอร์
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={form.waterIsFlat} onChange={() => setForm({ ...form, waterIsFlat: true })} className="accent-primary" />เหมาจ่าย
                </label>
              </Field>
              {form.waterIsFlat ? (
                <Field label="ค่าน้ำเหมาจ่าย (บาท/เดือน)">
                  <input type="number" onFocus={(e) => e.target.select()} value={form.waterFlatAmount || 0} onChange={e => setForm({ ...form, waterFlatAmount: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
                </Field>
              ) : (
                <>
                  <Field label="อัตราค่าน้ำ (บาท/หน่วย)">
                    <input type="number" onFocus={(e) => e.target.select()} step="0.5" value={form.waterRate} onChange={e => setForm({ ...form, waterRate: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
                  </Field>
                  <Field label="ค่าขั้นต่ำ (บาท/เดือน)">
                    <input type="number" onFocus={(e) => e.target.select()} value={form.waterMin} onChange={e => setForm({ ...form, waterMin: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* Billing */}
          <div className="rounded-xl border border-border bg-surface shadow-card p-6">
            <h4 className="text-sm font-bold text-text-primary mb-4">📋 รอบบิล & มัดจำ</h4>
            <Field label="ออกบิลวันที่">
              <input type="number" onFocus={(e) => e.target.select()} min={1} max={28} value={form.billingDay} onChange={e => setForm({ ...form, billingDay: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-20 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
              <span className="text-[11px] text-text-muted">ของทุกเดือน</span>
            </Field>
            <Field label="ครบกำหนดชำระใน">
              <input type="number" onFocus={(e) => e.target.select()} min={1} max={30} value={form.dueDays} onChange={e => setForm({ ...form, dueDays: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-20 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
              <span className="text-[11px] text-text-muted">วัน</span>
            </Field>
            <Field label="มัดจำ (Security Deposit)">
              <input type="number" onFocus={(e) => e.target.select()} min={0} max={12} value={form.securityDepositMonths} onChange={e => setForm({ ...form, securityDepositMonths: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-20 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
              <span className="text-[11px] text-text-muted">เดือน</span>
            </Field>
            <Field label="จ่ายล่วงหน้า (Advance)">
              <input type="number" onFocus={(e) => e.target.select()} min={0} max={6} value={form.advancePayMonths} onChange={e => setForm({ ...form, advancePayMonths: (e.target.value === "" ? "" as any : Number(e.target.value)) })} className="w-20 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
              <span className="text-[11px] text-text-muted">เดือน</span>
            </Field>
          </div>

          {/* Monthly Extras */}
          <div className="rounded-xl border border-border bg-surface shadow-card p-6">
            <h4 className="text-sm font-bold text-text-primary mb-4">💳 ค่าบริการเสริมรายเดือน</h4>
            <Field label="ค่าส่วนกลาง (บาท/เดือน)">
              <input type="number" onFocus={(e) => e.target.select()} value={form.commonFee || ""} onChange={e => setForm({ ...form, commonFee: e.target.value ? (e.target.value === "" ? "" as any : Number(e.target.value)) : null })} placeholder="ไม่มี" className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
            </Field>
            <Field label="ค่าที่จอดรถ (บาท/เดือน)">
              <input type="number" onFocus={(e) => e.target.select()} value={form.parkingFee || ""} onChange={e => setForm({ ...form, parkingFee: e.target.value ? (e.target.value === "" ? "" as any : Number(e.target.value)) : null })} placeholder="ไม่มี" className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
            </Field>
            <Field label="ค่าอินเทอร์เน็ต (บาท/เดือน)">
              <input type="number" onFocus={(e) => e.target.select()} value={form.internetFee || ""} onChange={e => setForm({ ...form, internetFee: e.target.value ? (e.target.value === "" ? "" as any : Number(e.target.value)) : null })} placeholder="ไม่มี" className="w-28 rounded-md border border-border px-2 py-1.5 text-sm text-right focus:border-primary focus:outline-none" />
            </Field>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-600" : "bg-primary hover:bg-primary-hover"} disabled:opacity-50`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Save className="h-4 w-4" /> บันทึกแล้ว!</> : <><Save className="h-4 w-4" /> บันทึกการตั้งค่า</>}
            </button>
          </div>
        </>
      )}

      {/* Copy Modal */}
      {showCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">📋 คัดลอกจากสาขาอื่น</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-text-secondary">เลือกสาขาต้นทาง</label>
              <select value={copyFrom} onChange={e => setCopyFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none">
                <option value="">-- เลือกสาขา --</option>
                {branches.filter(b => b.id !== branchId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <div className="text-sm font-medium text-text-secondary mb-2">เลือกรายการที่จะคัดลอก</div>
              {[
                { id: "utility", label: "⚡ ค่าน้ำ-ไฟ" },
                { id: "deposit", label: "💰 ค่ามัดจำ" },
                { id: "billing", label: "📋 รอบบิล" },
                { id: "time", label: "⏰ เวลา Check-in/out" },
                { id: "extras", label: "💳 ค่าบริการเสริม" },
              ].map(s => (
                <label key={s.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={copySections.includes(s.id)} onChange={() => toggleCopySection(s.id)} className="accent-primary" />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-[12px] text-amber-800">
              ⚠️ การคัดลอกจะแทนที่ค่าปัจจุบันของสาขานี้
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCopy(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleCopy} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">📋 คัดลอก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

