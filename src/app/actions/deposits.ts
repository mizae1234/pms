"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getDeposits(branchId?: string, status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const deposits = await prisma.deposit.findMany({
    where: {
      contract: {
        room: { branch: branchAccess }
      },
      ...(status ? { status: status as any } : {})
    },
    include: {
      contract: {
        include: {
          room: { select: { number: true, branch: { select: { name: true } } } },
          customer: { select: { name: true, phone: true } }
        }
      }
    },
    orderBy: { receivedAt: 'desc' }
  });

  return deposits;
}

export async function processRefund(
  depositId: string, 
  refundAmount: number, 
  deductions: number,
  notes?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });
  if (!deposit) throw new Error("ไม่พบรายการมัดจำ");
  
  if (deposit.status === "REFUNDED" || deposit.status === "FORFEITED") {
    throw new Error("มัดจำนี้ถูกจัดการไปแล้ว");
  }

  // Calculate new status
  // If we refund some, and deduct some, status depends on total.
  // Actually, standard is: if refundAmount + deductions >= deposit.amount, it's fully processed.
  // We'll just set it to REFUNDED if refundAmount > 0 and it's final, or PARTIALLY_REFUNDED.
  
  let newStatus = "REFUNDED";
  if (refundAmount === 0 && deductions > 0) newStatus = "FORFEITED";
  if (refundAmount > 0 && refundAmount < deposit.amount && deductions === 0) newStatus = "PARTIALLY_REFUNDED";

  const updated = await prisma.deposit.update({
    where: { id: depositId },
    data: {
      refundedAmount: refundAmount,
      status: newStatus as any,
      refundedAt: new Date(),
      notes: notes ? `${deposit.notes ? deposit.notes + '\n' : ''}หักค่าเสียหาย/อื่นๆ: ${deductions}บ. | คืนเงิน: ${refundAmount}บ. | หมายเหตุ: ${notes}` : deposit.notes
    }
  });

  revalidatePath("/deposits");
  return updated;
}
