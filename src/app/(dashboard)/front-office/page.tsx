"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Loader2, LogIn, LogOut, Clock, Phone, Search, BedDouble } from "lucide-react";
import { getFrontOfficeData, type FrontOfficeData, type FrontOfficeRoom } from "@/app/actions/front-office";
import { updateBookingStatus } from "@/app/actions/bookings";
import { formatTime } from "@/lib/utils";
import { 
  RoomCard, 
  QuickBookingForm, 
  RoomDetailSidebar, 
  roomTypeConfig 
} from "@/components/front-office/room-components";

export default function FrontOfficePage() {
  const [data, setData] = useState<FrontOfficeData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const [selectedRoom, setSelectedRoom] = useState<FrontOfficeRoom | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { 
      setData(await getFrontOfficeData(selectedBranch || undefined)); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, [selectedBranch]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleCheckIn = async (bookingId: string) => {
    if (!confirm("ยืนยันการ Check-in?")) return;
    try { 
      await updateBookingStatus(bookingId, "CHECKED_IN"); 
      setSelectedRoom(null); 
      fetchData(); 
    } catch (e) { 
      alert("Error: " + (e instanceof Error ? e.message : "Unknown")); 
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    if (!confirm("ยืนยันการ Check-out?")) return;
    try { 
      await updateBookingStatus(bookingId, "CHECKED_OUT"); 
      setSelectedRoom(null); 
      fetchData(); 
    } catch (e) { 
      alert("Error: " + (e instanceof Error ? e.message : "Unknown")); 
    }
  };

  // Filter Logic
  const filteredRooms = data?.rooms.filter((r) => {
    if (selectedFloor !== "" && r.floor !== selectedFloor) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNumber = r.number.toLowerCase().includes(q);
      const matchGuest = r.currentGuest?.name.toLowerCase().includes(q) ?? false;
      if (!matchNumber && !matchGuest) return false;
    }
    return true;
  }) ?? [];

  const roomsByFloor = filteredRooms.reduce((acc, room) => { 
    if (!acc[room.floor]) acc[room.floor] = []; 
    acc[room.floor].push(room); 
    return acc; 
  }, {} as Record<number, FrontOfficeRoom[]>);

  return (
    <div className="animate-fade-in">
      <Header 
        title="Front Office" 
        subtitle="ศูนย์ปฏิบัติการ — ดูสถานะห้องพัก เช็คอิน/เช็คเอาท์" 
        branches={data?.branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="p-6">
          
          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-5 mb-4">
            <button onClick={() => setFilterStatus('')} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${!filterStatus ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />ทั้งหมด ({data.rooms.length})
            </button>
            <button onClick={() => setFilterStatus(filterStatus === 'AVAILABLE' ? '' : 'AVAILABLE')} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${filterStatus === 'AVAILABLE' ? 'text-emerald-700' : 'text-text-muted hover:text-text-primary'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />ว่าง ({data.statusSummary.available})
            </button>
            <button onClick={() => setFilterStatus(filterStatus === 'OCCUPIED' ? '' : 'OCCUPIED')} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${filterStatus === 'OCCUPIED' ? 'text-blue-700' : 'text-text-muted hover:text-text-primary'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />ไม่ว่าง ({data.statusSummary.occupied})
            </button>
            <button onClick={() => setFilterStatus(filterStatus === 'CLEANING' ? '' : 'CLEANING')} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${filterStatus === 'CLEANING' ? 'text-amber-700' : 'text-text-muted hover:text-text-primary'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />ทำความสะอาด ({data.statusSummary.cleaning})
            </button>
            <button onClick={() => setFilterStatus(filterStatus === 'MAINTENANCE' ? '' : 'MAINTENANCE')} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${filterStatus === 'MAINTENANCE' ? 'text-red-700' : 'text-text-muted hover:text-text-primary'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />ซ่อมบำรุง ({data.statusSummary.maintenance})
            </button>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="ค้นหาเลขห้อง / ชื่อแขก..." 
                className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">ทุกประเภท</option>
              {Object.entries(roomTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select 
              value={selectedFloor} 
              onChange={(e) => setSelectedFloor(e.target.value ? Number(e.target.value) : "")} 
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">ทุกชั้น</option>
              {data.floors.map((f) => (
                <option key={f} value={f}>ชั้น {f}</option>
              ))}
            </select>
            {(searchQuery || filterType || filterStatus || selectedFloor !== "") && (
              <button 
                onClick={() => { setSearchQuery(""); setFilterType(""); setFilterStatus(""); setSelectedFloor(""); }} 
                className="text-[12px] text-primary hover:underline font-medium px-2"
              >
                ล้างตัวกรอง
              </button>
            )}
            <span className="ml-auto text-[12px] text-text-muted font-medium bg-gray-100 px-2 py-1 rounded-md">
              พบ {filteredRooms.length}/{data.rooms.length} ห้อง
            </span>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
            
            {/* Room Grid */}
            <div className="space-y-6">
              {Object.entries(roomsByFloor).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, rooms]) => (
                <div key={floor} className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50/70 px-5 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-text-primary">ชั้น {floor}</h3>
                    <span className="text-[12px] text-text-muted font-medium">{rooms.length} ห้อง</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {rooms.map((room) => (
                        <RoomCard 
                          key={room.id} 
                          room={room} 
                          isSelected={selectedRoom?.id === room.id} 
                          onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(roomsByFloor).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-surface border-dashed">
                  <BedDouble className="h-12 w-12 text-text-muted/30 mb-3" />
                  <p className="text-text-muted font-medium">ไม่พบห้องพักที่ตรงกับเงื่อนไข</p>
                  <button onClick={() => { setSearchQuery(""); setFilterType(""); setFilterStatus(""); setSelectedFloor(""); }} className="mt-2 text-sm text-primary hover:underline">
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>

            {/* Right Sidebar — context sensitive */}
            <div className="space-y-5 sticky top-24">
              
              {/* Selected Room Detail / Quick Booking */}
              {selectedRoom && selectedRoom.status === "AVAILABLE" ? (
                <QuickBookingForm 
                  room={selectedRoom} 
                  onSuccess={() => { setSelectedRoom(null); fetchData(); }} 
                  onCancel={() => setSelectedRoom(null)} 
                />
              ) : selectedRoom ? (
                <RoomDetailSidebar 
                  room={selectedRoom} 
                  onCheckIn={handleCheckIn} 
                  onCheckOut={handleCheckOut} 
                  onClose={() => setSelectedRoom(null)} 
                />
              ) : null}

              {/* Today's Arrivals */}
              <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
                <div className="flex items-center justify-between bg-emerald-50/50 px-5 py-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-emerald-800">เข้าพักวันนี้</h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    {data.todayArrivals.length} รอเข้า
                  </span>
                </div>
                <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
                  {data.todayArrivals.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[13px] text-text-muted">ไม่มีผู้เข้าพักวันนี้</div>
                  ) : data.todayArrivals.map((a) => (
                    <div key={a.id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{a.customerName}</p>
                          <p className="text-[12px] text-text-muted mt-0.5">ห้อง {a.roomNumber} • {roomTypeConfig[a.roomType]?.label || a.roomType}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-medium text-text-muted">
                          <Clock className="h-3 w-3" />
                          {formatTime(a.checkIn)}
                        </div>
                      </div>
                      {a.customerPhone && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-text-muted">
                          <Phone className="h-3 w-3" />
                          {a.customerPhone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Departures */}
              <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
                <div className="flex items-center justify-between bg-rose-50/50 px-5 py-3 border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-rose-800">ออกวันนี้</h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    {data.todayDepartures.length} รอออก
                  </span>
                </div>
                <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
                  {data.todayDepartures.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[13px] text-text-muted">ไม่มีผู้ออกวันนี้</div>
                  ) : data.todayDepartures.map((d) => (
                    <div key={d.id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{d.customerName}</p>
                          <p className="text-[12px] text-text-muted mt-0.5">ห้อง {d.roomNumber} • {roomTypeConfig[d.roomType]?.label || d.roomType}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-medium text-text-muted">
                          <Clock className="h-3 w-3" />
                          {formatTime(d.checkOut)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupancy Rate */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-blue-50 p-5 shadow-card">
                <h3 className="text-sm font-bold text-text-primary mb-3">อัตราการเข้าพักรวม</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {data.rooms.length > 0 ? Math.round((data.statusSummary.occupied / data.rooms.length) * 100) : 0}%
                  </span>
                  <span className="text-[12px] text-text-muted font-medium">
                    {data.statusSummary.occupied}/{data.rooms.length} ห้อง
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-700" 
                    style={{ width: `${data.rooms.length > 0 ? (data.statusSummary.occupied / data.rooms.length) * 100 : 0}%` }} 
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
