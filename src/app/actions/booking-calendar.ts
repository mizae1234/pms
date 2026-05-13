"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface CalendarRoomData {
  id: string;
  number: string;
  type: string;
  branchName: string;
  bookings: {
    id: string;
    customerName: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
  }[];
}

export async function getCalendarData(startDate: Date, endDate: Date): Promise<CalendarRoomData[]> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  const rooms = await prisma.room.findMany({
    where: branchAccess,
    include: {
      branch: true,
      bookings: {
        where: {
          status: { notIn: ["CANCELLED"] },
          OR: [
            { checkIn: { lte: endDate }, checkOut: { gte: startDate } }
          ]
        },
        include: { customer: true }
      }
    },
    orderBy: [{ branchId: "asc" }, { number: "asc" }]
  });

  return rooms.map(r => ({
    id: r.id,
    number: r.number,
    type: r.type,
    branchName: r.branch.name,
    bookings: r.bookings.map(b => ({
      id: b.id,
      customerName: b.customer.name,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
    }))
  }));
}
