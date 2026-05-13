"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { todayStartBangkok, todayEndBangkok } from "@/lib/utils";

// ===== Interfaces =====

export interface FrontOfficeRoom {
  id: string;
  number: string;
  floor: number;
  type: string;
  status: string; // AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_ORDER
  basePrice: number;
  branchId: string;
  branchName: string;
  propertyType: string;
  // Current guest (if occupied)
  currentGuest?: {
    name: string;
    bookingId: string;
    checkOut: Date;
    status: string;
  };
}

export interface TodayArrival {
  id: string;
  customerName: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  checkIn: Date;
  status: string;
  branchName: string;
}

export interface TodayDeparture {
  id: string;
  customerName: string;
  roomNumber: string;
  roomType: string;
  checkOut: Date;
  status: string;
  branchName: string;
}

export interface StatusSummary {
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
}

export interface FrontOfficeData {
  rooms: FrontOfficeRoom[];
  floors: number[];
  branches: { id: string; name: string; propertyType: string }[];
  todayArrivals: TodayArrival[];
  todayDepartures: TodayDeparture[];
  statusSummary: StatusSummary;
}

export async function getFrontOfficeData(branchId?: string): Promise<FrontOfficeData> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomWhere: any = {
    isActive: true,
    ...branchAccess,
  };
  if (branchId) {
    roomWhere.branchId = branchId;
  }

  const todayStart = todayStartBangkok();
  const todayEnd = todayEndBangkok();

  const [rooms, branches, todayArrivals, todayDepartures] = await Promise.all([
    // All rooms with current active booking
    prisma.room.findMany({
      where: roomWhere,
      include: {
        branch: { include: { property: true } },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkIn: { lte: todayEnd },
            checkOut: { gte: todayStart },
          },
          include: { customer: true },
          take: 1,
          orderBy: { checkIn: "asc" },
        },
      },
      orderBy: [{ branchId: "asc" }, { floor: "asc" }, { number: "asc" }],
    }),
    // Available branches
    prisma.branch.findMany({
      where: branchAccess.branchId ? { id: branchAccess.branchId } : { isActive: true },
      include: { property: true },
      orderBy: { name: "asc" },
    }),
    // Today's arrivals (bookings checking in today)
    prisma.booking.findMany({
      where: {
        room: roomWhere,
        checkIn: { gte: todayStart, lte: todayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        customer: true,
        room: { include: { branch: true } },
      },
      orderBy: { checkIn: "asc" },
    }),
    // Today's departures (bookings checking out today)
    prisma.booking.findMany({
      where: {
        room: roomWhere,
        checkOut: { gte: todayStart, lte: todayEnd },
        status: "CHECKED_IN",
      },
      include: {
        customer: true,
        room: { include: { branch: true } },
      },
      orderBy: { checkOut: "asc" },
    }),
  ]);

  // Map rooms
  const mappedRooms: FrontOfficeRoom[] = rooms.map((r) => {
    const activeBooking = r.bookings[0];
    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      type: r.type,
      status: r.status,
      basePrice: r.basePrice,
      branchId: r.branchId,
      branchName: r.branch.name,
      propertyType: r.branch.property.type,
      currentGuest: activeBooking
        ? {
            name: activeBooking.customer.name,
            bookingId: activeBooking.id,
            checkOut: activeBooking.checkOut,
            status: activeBooking.status,
          }
        : undefined,
    };
  });

  // Collect unique floors
  const floors = [...new Set(mappedRooms.map((r) => r.floor))].sort((a, b) => a - b);

  // Status summary
  const statusSummary: StatusSummary = {
    available: mappedRooms.filter((r) => r.status === "AVAILABLE").length,
    occupied: mappedRooms.filter((r) => r.status === "OCCUPIED").length,
    cleaning: mappedRooms.filter((r) => r.status === "CLEANING").length,
    maintenance: mappedRooms.filter((r) => r.status === "MAINTENANCE" || r.status === "OUT_OF_ORDER").length,
  };

  return {
    rooms: mappedRooms,
    floors,
    branches: branches.map((b) => ({
      id: b.id,
      name: `${b.property.name} ${b.name}`,
      propertyType: b.property.type,
    })),
    todayArrivals: todayArrivals.map((b) => ({
      id: b.id,
      customerName: b.customer.name,
      customerPhone: b.customer.phone || "",
      roomNumber: b.room.number,
      roomType: b.room.type,
      checkIn: b.checkIn,
      status: b.status,
      branchName: b.room.branch.name,
    })),
    todayDepartures: todayDepartures.map((b) => ({
      id: b.id,
      customerName: b.customer.name,
      roomNumber: b.room.number,
      roomType: b.room.type,
      checkOut: b.checkOut,
      status: b.status,
      branchName: b.room.branch.name,
    })),
    statusSummary,
  };
}
