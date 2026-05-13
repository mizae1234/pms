"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import { getAvailableBranches } from "@/app/actions/booking-helpers";

interface HeaderProps {
  title: string;
  subtitle?: string;
  branches?: { id: string; name: string }[];
  selectedBranch?: string;
  onBranchChange?: (id: string) => void;
}

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  BRANCH_MANAGER: "Manager",
  STAFF: "Staff",
  HOUSEKEEPER: "Housekeeper",
};

export function Header({ title, subtitle, branches: propBranches, selectedBranch, onBranchChange }: HeaderProps) {
  const user = useAuth();
  const [internalBranches, setInternalBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!propBranches) {
      getAvailableBranches().then(setInternalBranches).catch(console.error);
    }
  }, [propBranches]);

  const displayBranches = propBranches || internalBranches;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-header-border bg-header-bg px-6">
      {/* Left — Page title */}
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-text-muted">{subtitle}</p>
        )}
      </div>

      {/* Right — Branch selector + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 lg:flex">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="ค้นหา..."
            className="w-44 border-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">⌘K</kbd>
        </div>

        {/* Branch Selector */}
        {displayBranches.length > 0 ? (
          <div className="relative">
            <select
              value={selectedBranch || ""}
              onChange={(e) => onBranchChange?.(e.target.value)}
              className="appearance-none flex items-center gap-2 rounded-lg border border-border bg-surface pl-8 pr-8 py-1.5 text-sm font-medium text-text-secondary hover:border-border-hover hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
            >
              <option value="">ทุกสาขา</option>
              {displayBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-success pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>
        ) : (
          <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary opacity-50 cursor-not-allowed">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>กำลังโหลด...</span>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          </button>
        )}

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
          </span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-text-primary leading-tight">{user.name}</span>
            <span className="text-[10px] text-text-muted leading-tight">{roleLabels[user.role] || user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
