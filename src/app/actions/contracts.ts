"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getContracts(branchId?: string, status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const contracts = await prisma.contract.findMany({
    where: {
      room: {
        branch: branchAccess
      },
      ...(status ? { status: status as any } : {})
    },
    include: {
      room: {
        select: { id: true, number: true, branch: { select: { name: true } } }
      },
      customer: {
        select: { id: true, name: true, phone: true }
      },
      deposits: true
    },
    orderBy: { startDate: 'desc' }
  });

  return contracts;
}

export async function createContract(data: {
  roomId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  terms?: string;
  depositAmount: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.roomId || !data.customerId) throw new Error("ข้อมูลไม่ครบถ้วน");

  // Create contract
  const contract = await prisma.contract.create({
    data: {
      roomId: data.roomId,
      customerId: data.customerId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      status: "ACTIVE",
      terms: data.terms,
      deposits: {
        create: {
          type: "SECURITY",
          amount: data.depositAmount,
          status: "HELD"
        }
      }
    }
  });

  // Update room status
  await prisma.room.update({
    where: { id: data.roomId },
    data: { status: "OCCUPIED" }
  });

  revalidatePath("/contracts");
  return contract;
}

export async function updateContract(
  id: string,
  data: {
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    terms?: string;
    status: "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING";
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      terms: data.terms,
      status: data.status
    },
    include: { room: true }
  });

  // If contract is terminated or expired, free up the room
  if (data.status === "TERMINATED" || data.status === "EXPIRED") {
    // Check if there are other active contracts or bookings for this room
    const activeContracts = await prisma.contract.count({
      where: { roomId: contract.roomId, status: "ACTIVE" }
    });
    
    if (activeContracts === 0) {
      await prisma.room.update({
        where: { id: contract.roomId },
        data: { status: "AVAILABLE" }
      });
    }
  }

  revalidatePath("/contracts");
  return contract;
}

export async function deleteContract(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบสัญญาเช่า");
  }

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new Error("ไม่พบสัญญา");

  await prisma.contract.delete({ where: { id } });

  // Update room status if no active contracts left
  const activeContracts = await prisma.contract.count({
    where: { roomId: contract.roomId, status: "ACTIVE" }
  });
  
  if (activeContracts === 0) {
    await prisma.room.update({
      where: { id: contract.roomId },
      data: { status: "AVAILABLE" }
    });
  }

  revalidatePath("/contracts");
}
