"use client";

import { Search, X, Filter } from "lucide-react";

interface RoomFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterFloor: string;
  onFloorChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterBranch: string;
  onBranchChange: (value: string) => void;
  branches: { id: string; name: string }[];
  floors: number[];
  onClear: () => void;
}

const roomTypes = [
  { value: "STANDARD", label: "Standard" },
  { value: "DELUXE", label: "Deluxe" },
  { value: "SUITE", label: "Suite" },
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" },
  { value: "TWO_BED", label: "2 Bedroom" },
  { value: "PENTHOUSE", label: "Penthouse" },
];

const roomStatuses = [
  { value: "AVAILABLE", label: "ว่าง" },
  { value: "OCCUPIED", label: "ไม่ว่าง" },
  { value: "CLEANING", label: "ทำความสะอาด" },
  { value: "MAINTENANCE", label: "ซ่อมบำรุง" },
  { value: "OUT_OF_ORDER", label: "ปิดปรับปรุง" },
];

export function RoomFilters({
  search, onSearchChange,
  filterFloor, onFloorChange,
  filterType, onTypeChange,
  filterStatus, onStatusChange,
  filterBranch, onBranchChange,
  branches, floors, onClear,
}: RoomFiltersProps) {
  const hasFilters = search || filterFloor || filterType || filterStatus || filterBranch;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="ค้นหาเลขห้อง..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select value={filterBranch} onChange={(e) => onBranchChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">ทุกสาขา</option>
          {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
        </select>

        <select value={filterFloor} onChange={(e) => onFloorChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">ทุกชั้น</option>
          {floors.map((f) => (<option key={f} value={f}>ชั้น {f}</option>))}
        </select>

        <select value={filterType} onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">ทุกประเภท</option>
          {roomTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>

        <select value={filterStatus} onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">ทุกสถานะ</option>
          {roomStatuses.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>

        <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover transition-colors">
          <Filter className="h-3.5 w-3.5" />
          กรอง
        </button>

        {hasFilters && (
          <button onClick={onClear}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-colors">
            <X className="h-3.5 w-3.5" />
            ล้าง
          </button>
        )}
      </div>
    </div>
  );
}
