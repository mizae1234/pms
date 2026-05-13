"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getInvoices(branchId?: string, status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const invoices = await prisma.invoice.findMany({
    where: {
      branch: branchAccess,
      ...(status ? { status: status as any } : {})
    },
    include: {
      branch: { select: { name: true } },
      customer: { select: { name: true, phone: true } },
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return invoices;
}

export async function createInvoice(data: {
  branchId: string;
  customerId: string;
  items: { description: string, qty: number, price: number, total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate?: Date;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Generate simple invoice number INV-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.invoice.count({
    where: {
      number: { startsWith: `INV-${dateStr}` }
    }
  });
  const number = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      branchId: data.branchId,
      customerId: data.customerId,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: "DRAFT",
      dueDate: data.dueDate,
      notes: data.notes
    }
  });

  revalidatePath("/invoices");
  return invoice;
}

export async function updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.invoice.update({
    where: { id },
    data: { 
      status: status as any,
      paidAt: status === "PAID" ? new Date() : undefined
    }
  });

  revalidatePath("/invoices");
}

export async function deleteInvoice(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบใบแจ้งหนี้");
  }

  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { payments: true } });
  if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");
  if (invoice.payments.length > 0) throw new Error("ไม่สามารถลบใบแจ้งหนี้ที่มีการชำระเงินแล้วได้");

  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
}
