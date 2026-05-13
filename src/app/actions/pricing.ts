"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getSeasonalPrices(branchId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const prices = await prisma.seasonalPrice.findMany({
    where: { branch: branchAccess },
    include: { branch: { select: { name: true } } },
    orderBy: [{ startDate: 'asc' }, { roomType: 'asc' }]
  });

  return prices;
}

export async function createSeasonalPrice(data: {
  branchId: string;
  roomType: "STANDARD" | "DELUXE" | "SUITE" | "STUDIO" | "ONE_BED";
  name: string;
  startDate: Date;
  endDate: Date;
  price: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const price = await prisma.seasonalPrice.create({
    data: {
      branchId: data.branchId,
      roomType: data.roomType,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      price: data.price
    }
  });

  revalidatePath("/pricing");
  return price;
}

export async function updateSeasonalPrice(
  id: string,
  data: {
    roomType: "STANDARD" | "DELUXE" | "SUITE" | "STUDIO" | "ONE_BED";
    name: string;
    startDate: Date;
    endDate: Date;
    price: number;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const price = await prisma.seasonalPrice.update({
    where: { id },
    data: {
      roomType: data.roomType,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      price: data.price
    }
  });

  revalidatePath("/pricing");
  return price;
}

export async function deleteSeasonalPrice(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบข้อมูล");
  }

  await prisma.seasonalPrice.delete({ where: { id } });
  revalidatePath("/pricing");
}
