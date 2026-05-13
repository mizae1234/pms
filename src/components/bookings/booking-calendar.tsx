"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getCalendarData, type CalendarRoomData } from "@/app/actions/booking-calendar";
import { nowBangkok } from "@/lib/utils";

export function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(() => nowBangkok());
  const [data, setData] = useState<CalendarRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default view is 14 days starting from start of current week
  const { startDate, endDate } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return { startDate: start, endDate: addDays(start, 13) };
  }, [currentDate]);
  
  const days = useMemo(() => {
    const d = [];
    let curr = startDate;
    while (curr <= endDate) {
      d.push(curr);
      curr = addDays(curr, 1);
    }
    return d;
  }, [startDate, endDate]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rooms = await getCalendarData(startOfDay(startDate), endOfDay(endDate));
        setData(rooms);
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(nowBangkok());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-400";
      case "CONFIRMED": return "bg-blue-500";
      case "CHECKED_IN": return "bg-emerald-500";
      case "CHECKED_OUT": return "bg-gray-400";
      case "NO_SHOW": return "bg-red-500";
      default: return "bg-primary";
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 rounded-xl border border-border bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group by branch
  const groupedRooms = data.reduce((acc, room) => {
    if (!acc[room.branchName]) acc[room.branchName] = [];
    acc[room.branchName].push(room);
    return acc;
  }, {} as Record<string, CalendarRoomData[]>);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden flex flex-col h-[600px]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-text-primary">
            {format(startDate, "MMMM yyyy", { locale: th })}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevWeek} className="p-1.5 rounded-md hover:bg-surface-hover text-text-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-surface-hover text-text-secondary">
              วันนี้
            </button>
            <button onClick={handleNextWeek} className="p-1.5 rounded-md hover:bg-surface-hover text-text-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 text-[11px] font-medium text-text-muted">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> ยืนยันแล้ว</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Check-in</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> รอยืนยัน</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full min-w-[1000px] border-collapse relative">
          <thead className="sticky top-0 z-20 bg-white shadow-sm">
            <tr>
              <th className="sticky left-0 z-30 w-[180px] min-w-[180px] border-r border-b border-border bg-white px-4 py-3 text-left text-[12px] font-medium text-text-muted">
                ห้องพัก
              </th>
              {days.map((day) => {
                const isToday = isSameDay(day, nowBangkok());
                return (
                  <th key={day.toISOString()} className={`min-w-[60px] border-b border-r border-border px-2 py-2 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className={`text-[10px] font-medium uppercase ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                      {format(day, "EEE", { locale: th })}
                    </div>
                    <div className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                      {format(day, "d")}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedRooms).map(([branchName, rooms]) => (
              <React.Fragment key={branchName}>
                <tr>
                  <td colSpan={days.length + 1} className="bg-gray-50/80 px-4 py-2 text-[12px] font-bold text-text-secondary border-b border-border">
                    {branchName}
                  </td>
                </tr>
                {rooms.map(room => (
                  <tr key={room.id} className="border-b border-border group hover:bg-gray-50/30">
                    <td className="sticky left-0 z-10 w-[180px] border-r border-border bg-white group-hover:bg-gray-50/50 px-4 py-3">
                      <div className="font-semibold text-sm text-primary">ห้อง {room.number}</div>
                      <div className="text-[11px] text-text-muted">{room.type}</div>
                    </td>
                    
                    {/* Render days/cells */}
                    {days.map(day => {
                      // Find if any booking starts or overlaps this day
                      const booking = room.bookings.find(b => {
                        const checkInStart = startOfDay(b.checkIn);
                        const checkOutStart = startOfDay(b.checkOut);
                        const dayStart = startOfDay(day);
                        return dayStart >= checkInStart && dayStart < checkOutStart;
                      });

                      const isBookingStart = booking && isSameDay(day, booking.checkIn);

                      return (
                        <td key={day.toISOString()} className="border-r border-border relative p-0 min-w-[60px] h-12">
                          {booking && (
                            <div 
                              className={`absolute top-1 bottom-1 flex items-center px-2 z-10 overflow-hidden text-white text-[11px] font-medium transition-all ${getStatusColor(booking.status)} ${isBookingStart ? 'left-1 rounded-l-md' : '-left-[1px]'} ${isSameDay(day, addDays(booking.checkOut, -1)) ? 'right-1 rounded-r-md' : '-right-[1px]'}`}
                            >
                              {isBookingStart && (
                                <span className="truncate">{booking.customerName}</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
