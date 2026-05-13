"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { BedDouble, DollarSign, Building2 } from "lucide-react";

const tabs = [
  { id: "rooms", label: "ตั้งค่าห้องพัก", icon: BedDouble },
  { id: "rates", label: "อัตราค่าบริการ", icon: DollarSign },
  { id: "property", label: "ข้อมูลโครงการ", icon: Building2 },
] as const;

type TabId = (typeof tabs)[number]["id"];

// Lazy-load tab components
import RoomSetupWizard from "./room-setup-wizard";
import RateSettings from "./rate-settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("rooms");

  return (
    <div className="animate-fade-in">
      <Header title="ตั้งค่า" subtitle="จัดการการตั้งค่าระบบ — ห้องพัก, อัตราค่าบริการ, ข้อมูลโครงการ" />
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "rooms" && <RoomSetupWizard />}
        {activeTab === "rates" && <RateSettings />}
        {activeTab === "property" && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border bg-surface">
            <Building2 className="h-12 w-12 text-primary/40 mb-3" />
            <p className="text-text-primary font-semibold mb-1">จัดการโครงการ & สาขา</p>
            <p className="text-sm text-text-muted mb-5">เพิ่ม/แก้ไข Property และ Branch ได้ในหน้า &quot;โครงการ & สาขา&quot;</p>
            <a href="/branches"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              <Building2 className="h-4 w-4" /> ไปที่หน้าโครงการ & สาขา
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
