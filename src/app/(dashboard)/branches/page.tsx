"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import {
  Building2, Hotel, Home, Plus, ChevronDown, ChevronUp,
  Pencil, ToggleLeft, ToggleRight, Loader2, X, Check, BedDouble, Users
} from "lucide-react";
import {
  getAllProperties,
  createProperty,
  updateProperty,
  createBranch,
  updateBranch,
  toggleBranchActive,
} from "@/app/actions/properties";

type PropertyType = "HOTEL" | "APARTMENT";

interface BranchData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { rooms: number; users: number };
  settings: { electricRate: number; waterRate: number; billingDay: number } | null;
}

interface PropertyData {
  id: string;
  name: string;
  type: PropertyType;
  address: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  isSetupComplete: boolean;
  createdAt: Date;
  branches: BranchData[];
}

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-text-secondary">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// ── Add/Edit Property Modal ────────────────────────────────────────────────
function PropertyModal({ existing, onClose, onSaved }: {
  existing?: PropertyData; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<PropertyType>(existing?.type ?? "HOTEL");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [taxId, setTaxId] = useState(existing?.taxId ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("กรุณาระบุชื่อโครงการ"); return; }
    setSaving(true); setError("");
    try {
      const payload = { name, type, address, taxId, phone, email, description };
      if (existing) await updateProperty(existing.id, payload);
      else await createProperty(payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  return (
    <Modal title={existing ? "แก้ไขข้อมูลโครงการ" : "เพิ่มโครงการใหม่"} onClose={onClose}>
      <div className="space-y-4">
        {/* Property Type */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">ประเภทโครงการ<span className="text-red-500 ml-0.5">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: "HOTEL", label: "โรงแรม", sub: "รายวัน / OTA", icon: Hotel, color: "border-amber-400 bg-amber-50" },
              { v: "APARTMENT", label: "หอพัก/อพาร์ทเม้นท์", sub: "รายเดือน / สัญญาเช่า", icon: Home, color: "border-blue-400 bg-blue-50" },
            ].map(t => (
              <button key={t.v} onClick={() => setType(t.v as PropertyType)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${type === t.v ? t.color + " ring-2 ring-offset-1 ring-primary" : "border-border hover:border-gray-300"}`}>
                <t.icon className="h-6 w-6 mb-2 text-text-secondary" />
                <div className="font-semibold text-sm text-text-primary">{t.label}</div>
                <div className="text-xs text-text-muted mt-0.5">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>
        <Field label="ชื่อโครงการ" value={name} onChange={setName} placeholder="เช่น สุขุมวิท เรสซิเดนซ์" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="เลขผู้เสียภาษี" value={taxId} onChange={setTaxId} placeholder="0-0000-00000-00-0" />
          <Field label="เบอร์โทร" value={phone} onChange={setPhone} placeholder="02-xxx-xxxx" />
        </div>
        <Field label="อีเมล" value={email} onChange={setEmail} placeholder="info@example.com" />
        <Field label="ที่อยู่" value={address} onChange={setAddress} placeholder="ที่อยู่สำนักงาน" />
        <Field label="รายละเอียด (ถ้ามี)" value={description} onChange={setDescription} placeholder="คำอธิบายเพิ่มเติม" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {existing ? "บันทึกการแก้ไข" : "สร้างโครงการ"}
        </button>
      </div>
    </Modal>
  );
}

// ── Add/Edit Branch Modal ──────────────────────────────────────────────────
function BranchModal({ propertyId, propertyName, existing, onClose, onSaved }: {
  propertyId: string; propertyName: string; existing?: BranchData; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("กรุณาระบุชื่อสาขา"); return; }
    setSaving(true); setError("");
    try {
      if (existing) await updateBranch(existing.id, { name, address, phone, email });
      else await createBranch(propertyId, { name, address, phone, email });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  return (
    <Modal title={existing ? `แก้ไขสาขา — ${existing.name}` : `เพิ่มสาขาใหม่ใน ${propertyName}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="ชื่อสาขา" value={name} onChange={setName} placeholder="เช่น สาขาสุขุมวิท" required />
        <Field label="ที่อยู่สาขา" value={address} onChange={setAddress} placeholder="ที่อยู่" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="เบอร์โทร" value={phone} onChange={setPhone} placeholder="02-xxx-xxxx" />
          <Field label="อีเมล" value={email} onChange={setEmail} placeholder="branch@example.com" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {existing ? "บันทึกการแก้ไข" : "เพิ่มสาขา"}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BranchesPage() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editProperty, setEditProperty] = useState<PropertyData | null>(null);
  const [addBranchTo, setAddBranchTo] = useState<PropertyData | null>(null);
  const [editBranch, setEditBranch] = useState<{ branch: BranchData; property: PropertyData } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProperties();
      setProperties(data as PropertyData[]);
      // Auto-expand all
      setExpandedIds(new Set(data.map(p => p.id)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleBranch = async (branchId: string, current: boolean) => {
    await toggleBranchActive(branchId, !current);
    load();
  };

  const typeConfig = {
    HOTEL: { label: "โรงแรม", icon: Hotel, badge: "bg-amber-100 text-amber-700 border-amber-200" },
    APARTMENT: { label: "หอพัก / อพาร์ทเม้นท์", icon: Home, badge: "bg-blue-100 text-blue-700 border-blue-200" },
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="โครงการ & สาขา" subtitle="จัดการอสังหาริมทรัพย์ทั้งหมดของคุณ" />
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="โครงการ & สาขา" subtitle="จัดการอสังหาริมทรัพย์ทั้งหมดของคุณ" />

      <div className="p-6 max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{properties.length} โครงการ</p>
              <p className="text-xs text-text-muted">{properties.reduce((s, p) => s + p.branches.length, 0)} สาขาทั้งหมด</p>
            </div>
          </div>
          <button onClick={() => setShowAddProperty(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> เพิ่มโครงการใหม่
          </button>
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">ยังไม่มีโครงการ</h3>
            <p className="text-sm text-text-muted mb-6">กดปุ่ม &quot;เพิ่มโครงการใหม่&quot; เพื่อเริ่มต้น</p>
            <button onClick={() => setShowAddProperty(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
              <Plus className="h-4 w-4" /> เพิ่มโครงการใหม่
            </button>
          </div>
        )}

        {/* Property cards */}
        <div className="space-y-4">
          {properties.map(prop => {
            const cfg = typeConfig[prop.type];
            const Icon = cfg.icon;
            const expanded = expandedIds.has(prop.id);

            return (
              <div key={prop.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                {/* Property Header */}
                <div className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-text-primary truncate">{prop.name}</h2>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {!prop.isSetupComplete && (
                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                          ยังไม่สมบูรณ์
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted flex-wrap">
                      {prop.phone && <span>📞 {prop.phone}</span>}
                      {prop.email && <span>✉️ {prop.email}</span>}
                      {prop.address && <span>📍 {prop.address}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditProperty(prop)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-50 transition-colors">
                      <Pencil className="h-3.5 w-3.5" /> แก้ไข
                    </button>
                    <button onClick={() => setAddBranchTo(prop)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors">
                      <Plus className="h-3.5 w-3.5" /> เพิ่มสาขา
                    </button>
                    <button onClick={() => toggleExpand(prop.id)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-gray-100">
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Branches */}
                {expanded && (
                  <div className="divide-y divide-border">
                    {prop.branches.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Building2 className="h-8 w-8 text-text-muted/30 mb-2" />
                        <p className="text-sm text-text-muted">ยังไม่มีสาขา</p>
                        <button onClick={() => setAddBranchTo(prop)}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
                          <Plus className="h-3.5 w-3.5" /> เพิ่มสาขาแรก
                        </button>
                      </div>
                    ) : (
                      prop.branches.map(branch => (
                        <div key={branch.id} className={`flex items-center gap-4 px-6 py-4 ${!branch.isActive ? "opacity-50 bg-gray-50" : "hover:bg-gray-50/50"} transition-colors`}>
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${branch.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">{branch.name}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted flex-wrap">
                              {branch.address && <span>{branch.address}</span>}
                              {branch.phone && <span>📞 {branch.phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-3 text-xs text-text-muted">
                              <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{branch._count.rooms} ห้อง</span>
                              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{branch._count.users} user</span>
                            </div>
                            <button onClick={() => setEditBranch({ branch, property: prop })}
                              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100">
                              <Pencil className="h-3 w-3" /> แก้ไข
                            </button>
                            <button onClick={() => handleToggleBranch(branch.id, branch.isActive)}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${branch.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                              {branch.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              {branch.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showAddProperty && (
        <PropertyModal onClose={() => setShowAddProperty(false)} onSaved={() => { setShowAddProperty(false); load(); }} />
      )}
      {editProperty && (
        <PropertyModal existing={editProperty} onClose={() => setEditProperty(null)} onSaved={() => { setEditProperty(null); load(); }} />
      )}
      {addBranchTo && (
        <BranchModal propertyId={addBranchTo.id} propertyName={addBranchTo.name}
          onClose={() => setAddBranchTo(null)} onSaved={() => { setAddBranchTo(null); load(); }} />
      )}
      {editBranch && (
        <BranchModal propertyId={editBranch.property.id} propertyName={editBranch.property.name}
          existing={editBranch.branch} onClose={() => setEditBranch(null)} onSaved={() => { setEditBranch(null); load(); }} />
      )}
    </div>
  );
}
