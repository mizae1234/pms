"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  todayBookings: number;
  todayCheckIn: number;
  todayCheckOut: number;
  monthlyRevenue: number;
  housekeepingTasks: number;
  urgentTasks: number;
  normalTasks: number;
  roomStatuses: { name: string; value: number; color: string }[];
  recentBookings: {
    id: string;
    roomNumber: string;
    customerName: string;
    branchName: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Build branch filter based on user role
  const branchFilter =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  const roomFilter = branchFilter.branchId
    ? { branchId: branchFilter.branchId }
    : {};

  // 1. Room stats
  const rooms = await prisma.room.groupBy({
    by: ["status"],
    where: { ...roomFilter, isActive: true },
    _count: { id: true },
  });

  const totalRooms = rooms.reduce((sum, r) => sum + r._count.id, 0);
  const occupiedRooms =
    rooms.find((r) => r.status === "OCCUPIED")?._count.id ?? 0;

  const statusMap: Record<string, { name: string; color: string }> = {
    AVAILABLE: { name: "ว่าง", color: "#10B981" },
    OCCUPIED: { name: "ถูกเช่า", color: "#2563EB" },
    CLEANING: { name: "ทำความสะอาด", color: "#F59E0B" },
    MAINTENANCE: { name: "ซ่อมบำรุง", color: "#EF4444" },
    OUT_OF_ORDER: { name: "ปิดปรับปรุง", color: "#94A3B8" },
  };

  const roomStatuses = Object.entries(statusMap).map(([key, meta]) => ({
    name: meta.name,
    value: rooms.find((r) => r.status === key)?._count.id ?? 0,
    color: meta.color,
  }));

  // 2. Today's bookings
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCheckIns = await prisma.booking.count({
    where: {
      room: roomFilter,
      checkIn: { gte: todayStart, lte: todayEnd },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
  });

  const todayCheckOuts = await prisma.booking.count({
    where: {
      room: roomFilter,
      checkOut: { gte: todayStart, lte: todayEnd },
      status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
    },
  });

  // 3. Monthly revenue
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyPayments = await prisma.payment.aggregate({
    where: {
      paidAt: { gte: monthStart },
      booking: roomFilter.branchId ? { room: roomFilter } : undefined,
    },
    _sum: { amount: true },
  });

  // Also count contract monthly rent for apartments
  const activeContracts = await prisma.contract.aggregate({
    where: {
      status: "ACTIVE",
      room: roomFilter,
    },
    _sum: { monthlyRent: true },
  });

  const monthlyRevenue =
    (monthlyPayments._sum.amount ?? 0) +
    (activeContracts._sum.monthlyRent ?? 0);

  // 4. Housekeeping
  const housekeepingTasks = await prisma.housekeepingTask.count({
    where: {
      room: roomFilter,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  const urgentTasks = await prisma.housekeepingTask.count({
    where: {
      room: roomFilter,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      priority: { in: ["HIGH", "URGENT"] },
    },
  });

  // 5. Recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { room: roomFilter },
    include: {
      room: { include: { branch: true } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return {
    totalRooms,
    occupiedRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    todayBookings: todayCheckIns + todayCheckOuts,
    todayCheckIn: todayCheckIns,
    todayCheckOut: todayCheckOuts,
    monthlyRevenue,
    housekeepingTasks,
    urgentTasks,
    normalTasks: housekeepingTasks - urgentTasks,
    roomStatuses,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      roomNumber: b.room.number,
      customerName: b.customer.name,
      branchName: b.room.branch.name,
      status: b.status,
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
      totalAmount: b.totalAmount,
    })),
  };
}
