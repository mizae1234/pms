"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getPayments(branchId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { invoice: { branch: branchAccess } },
        { booking: { room: { branch: branchAccess } } }
      ]
    },
    include: {
      invoice: { select: { number: true, customer: { select: { name: true } } } },
      booking: { select: { id: true, customer: { select: { name: true } }, room: { select: { number: true } } } }
    },
    orderBy: { paidAt: 'desc' }
  });

  return payments;
}

export async function recordPayment(data: {
  invoiceId?: string;
  bookingId?: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "QR_CODE" | "OTHER";
  referenceNo?: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!data.invoiceId && !data.bookingId) throw new Error("ต้องระบุใบแจ้งหนี้ หรือ การจอง");

  const payment = await prisma.payment.create({
    data: {
      invoiceId: data.invoiceId,
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      referenceNo: data.referenceNo,
      notes: data.notes,
      paidAt: new Date()
    }
  });

  // Automatically update invoice status if invoiceId is provided
  if (data.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ 
      where: { id: data.invoiceId },
      include: { payments: true }
    });
    
    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      let newStatus = invoice.status;
      
      if (totalPaid >= invoice.total) {
        newStatus = "PAID";
      } else if (totalPaid > 0) {
        newStatus = "PARTIALLY_PAID";
      }
      
      if (newStatus !== invoice.status) {
        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: { 
            status: newStatus as any,
            paidAt: newStatus === "PAID" ? new Date() : undefined
          }
        });
      }
    }
  }

  // Same logic can be applied to booking if needed

  revalidatePath("/payments");
  revalidatePath("/invoices");
  return payment;
}
