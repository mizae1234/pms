"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { RentalMode, RoomType, RoomStatus } from "@/generated/prisma/client";

// ===== Branch Settings =====

export async function getBranchSettings(branchId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let settings = await prisma.branchSettings.findUnique({ where: { branchId } });
  if (!settings) {
    settings = await prisma.branchSettings.create({ data: { branchId } });
  }
  return settings;
}

export async function updateBranchSettings(branchId: string, data: {
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  electricRate?: number;
  electricMin?: number;
  waterRate?: number;
  waterMin?: number;
  waterIsFlat?: boolean;
  waterFlatAmount?: number | null;
  billingDay?: number;
  dueDays?: number;
  securityDepositMonths?: number;
  advancePayMonths?: number;
  monthlyCleaningPerWeek?: number;
  commonFee?: number | null;
  parkingFee?: number | null;
  internetFee?: number | null;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.branchSettings.upsert({
    where: { branchId },
    update: data,
    create: { branchId, ...data },
  });
}

export async function copyBranchSettings(fromBranchId: string, toBranchId: string, sections: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const source = await prisma.branchSettings.findUnique({ where: { branchId: fromBranchId } });
  if (!source) throw new Error("ไม่พบการตั้งค่าต้นทาง");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};

  if (sections.includes("utility")) {
    updateData.electricRate = source.electricRate;
    updateData.electricMin = source.electricMin;
    updateData.waterRate = source.waterRate;
    updateData.waterMin = source.waterMin;
    updateData.waterIsFlat = source.waterIsFlat;
    updateData.waterFlatAmount = source.waterFlatAmount;
  }
  if (sections.includes("deposit")) {
    updateData.securityDepositMonths = source.securityDepositMonths;
    updateData.advancePayMonths = source.advancePayMonths;
  }
  if (sections.includes("billing")) {
    updateData.billingDay = source.billingDay;
    updateData.dueDays = source.dueDays;
  }
  if (sections.includes("time")) {
    updateData.defaultCheckIn = source.defaultCheckIn;
    updateData.defaultCheckOut = source.defaultCheckOut;
  }
  if (sections.includes("extras")) {
    updateData.commonFee = source.commonFee;
    updateData.parkingFee = source.parkingFee;
    updateData.internetFee = source.internetFee;
  }

  return prisma.branchSettings.upsert({
    where: { branchId: toBranchId },
    update: updateData,
    create: { branchId: toBranchId, ...updateData },
  });
}

// ===== Room Setup Wizard =====

export interface FloorConfig {
  floor: number;
  roomCount: number;
  roomType: string;
  rentalMode: string;
  prefix: string;
}

export interface RoomConfig {
  number: string;
  floor: number;
  type: string;
  rentalMode: string;
  basePrice: number;
  monthlyRate: number | null;
}

export async function bulkCreateRooms(branchId: string, rooms: RoomConfig[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (rooms.length === 0) throw new Error("ไม่มีห้องที่จะสร้าง");

  // Check for duplicate room numbers within the branch
  const existingRooms = await prisma.room.findMany({
    where: { branchId, number: { in: rooms.map(r => r.number) } },
    select: { number: true },
  });
  const existingNumbers = new Set(existingRooms.map(r => r.number));

  // Filter out rooms that already exist
  const newRooms = rooms.filter(r => !existingNumbers.has(r.number));

  if (newRooms.length === 0) {
    return { created: 0, skipped: rooms.length, message: "ห้องทั้งหมดมีอยู่แล้ว" };
  }

  await prisma.room.createMany({
    data: newRooms.map(r => ({
      branchId,
      number: r.number,
      floor: r.floor,
      type: r.type as RoomType,
      rentalMode: r.rentalMode as RentalMode,
      status: RoomStatus.AVAILABLE,
      basePrice: r.basePrice,
      monthlyRate: r.monthlyRate,
      isActive: true,
    })),
  });

  return {
    created: newRooms.length,
    skipped: existingNumbers.size,
    message: `สร้าง ${newRooms.length} ห้องสำเร็จ` + (existingNumbers.size > 0 ? ` (ข้าม ${existingNumbers.size} ห้องที่มีอยู่แล้ว)` : ""),
  };
}

export async function getExistingRooms(branchId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.room.findMany({
    where: { branchId, isActive: true },
    select: { id: true, number: true, floor: true, type: true, rentalMode: true, basePrice: true, monthlyRate: true },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });
}
