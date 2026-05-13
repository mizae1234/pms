"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface BookingWithDetails {
  id: string;
  source: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  roomNumber: string;
  branchName: string;
  propertyName: string;
}

export interface BookingsData {
  bookings: BookingWithDetails[];
  totalCount: number;
}

export async function getBookings(filters?: {
  search?: string;
  branchId?: string;
  status?: string;
  dateRange?: { from: Date; to: Date };
  page?: number;
  limit?: number;
}): Promise<BookingsData> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 10;

  // Branch filter based on user role
  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    room: {
      ...branchAccess,
    },
  };

  if (filters?.search) {
    where.OR = [
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
      { customer: { phone: { contains: filters.search } } },
      { room: { number: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters?.branchId) {
    where.room.branchId = filters.branchId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.dateRange?.from && filters?.dateRange?.to) {
    where.checkIn = { gte: filters.dateRange.from };
    where.checkOut = { lte: filters.dateRange.to };
  }

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: true,
        room: {
          include: {
            branch: {
              include: { property: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      source: b.source,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      totalAmount: b.totalAmount,
      customerName: b.customer.name,
      customerPhone: b.customer.phone || "",
      roomNumber: b.room.number,
      branchName: b.room.branch.name,
      propertyName: b.room.branch.property.name,
    })),
    totalCount,
  };
}

export async function createBooking(data: {
  roomId: string;
  customerId: string;
  checkIn: Date;
  checkOut: Date;
  source: string;
  totalAmount: number;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  // Basic conflict check
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      roomId: data.roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      OR: [
        {
          checkIn: { lt: data.checkOut },
          checkOut: { gt: data.checkIn },
        },
      ],
    },
  });

  if (conflictingBooking) {
    throw new Error("ห้องนี้ถูกจองแล้วในช่วงเวลาดังกล่าว");
  }

  const booking = await prisma.booking.create({
    data: {
      roomId: data.roomId,
      customerId: data.customerId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      source: data.source as any,
      status: "CONFIRMED",
      totalAmount: data.totalAmount,
      notes: data.notes,
    },
  });

  revalidatePath("/bookings");
  return booking;
}

export async function updateBookingStatus(id: string, status: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const booking = await prisma.booking.update({
    where: { id },
    data: { status: status as any },
    include: { room: true },
  });

  // Update room status automatically based on booking status
  if (status === "CHECKED_IN") {
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "OCCUPIED" },
    });
  } else if (status === "CHECKED_OUT") {
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "CLEANING" },
    });
  }

  revalidatePath("/bookings");
  return booking;
}
