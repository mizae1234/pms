"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getDashboardStats(branchId?: string, month?: number, year?: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month !== undefined ? month : new Date().getMonth();

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // 1. Room Status (Occupancy)
  const rooms = await prisma.room.findMany({
    where: { branch: branchAccess },
    select: { status: true }
  });

  const roomStatusCounts: Record<string, number> = {
    AVAILABLE: 0,
    OCCUPIED: 0,
    MAINTENANCE: 0,
    CLEANING: 0,
    OUT_OF_ORDER: 0
  };

  rooms.forEach(r => {
    if (roomStatusCounts[r.status] !== undefined) {
      roomStatusCounts[r.status]++;
    }
  });

  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? (roomStatusCounts.OCCUPIED / totalRooms) * 100 : 0;

  // 2. Revenue (Payments received in the selected month)
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { invoice: { branch: branchAccess } },
        { booking: { room: { branch: branchAccess } } }
      ],
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // 3. Invoices (Unpaid vs Paid for the month)
  const invoices = await prisma.invoice.findMany({
    where: {
      branch: branchAccess,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  let totalInvoiced = 0;
  let collectedAmount = 0;
  let overdueAmount = 0;

  invoices.forEach(inv => {
    totalInvoiced += inv.total;
    if (inv.status === "PAID") collectedAmount += inv.total;
    if (inv.status === "PARTIALLY_PAID") {
        // Just rough estimate if partial info is complex to fetch synchronously without DB joins, 
        // we can fetch payments sum. For simple stats we count it as "partially collected".
    }
    if (inv.status === "OVERDUE" || (inv.dueDate && inv.dueDate < new Date() && inv.status !== "PAID")) {
      overdueAmount += inv.total;
    }
  });

  // Calculate actual collected from payments for these invoices
  // To be perfectly accurate we'd map payments to invoices
  
  // 4. Deposits held
  const deposits = await prisma.deposit.aggregate({
    where: {
      contract: { room: { branch: branchAccess } },
      status: "HELD"
    },
    _sum: { amount: true }
  });

  return {
    occupancy: {
      rate: occupancyRate,
      counts: roomStatusCounts,
      total: totalRooms
    },
    finance: {
      totalRevenue,
      totalInvoiced,
      overdueAmount,
      depositsHeld: deposits._sum.amount || 0
    },
    payments,
    invoices
  };
}
