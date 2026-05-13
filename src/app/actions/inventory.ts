"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getInventoryItems(branchId?: string, search?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const items = await prisma.inventoryItem.findMany({
    where: {
      branch: branchAccess,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ]
      } : {})
    },
    include: {
      branch: { select: { name: true } }
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  return items;
}

export async function createInventoryItem(data: {
  branchId: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost?: number;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!data.branchId) throw new Error("กรุณาระบุสาขา");
  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อสิ่งของ");

  const item = await prisma.inventoryItem.create({
    data: {
      branchId: data.branchId,
      name: data.name.trim(),
      category: data.category?.trim() || null,
      quantity: data.quantity,
      unit: data.unit.trim() || "ชิ้น",
      minStock: data.minStock,
      cost: data.cost,
      notes: data.notes?.trim() || null,
    }
  });

  revalidatePath("/inventory");
  return item;
}

export async function updateInventoryItem(
  id: string,
  data: {
    name: string;
    category?: string;
    unit: string;
    minStock: number;
    cost?: number;
    notes?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อสิ่งของ");

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name.trim(),
      category: data.category?.trim() || null,
      unit: data.unit.trim() || "ชิ้น",
      minStock: data.minStock,
      cost: data.cost,
      notes: data.notes?.trim() || null,
    }
  });

  revalidatePath("/inventory");
  return item;
}

export async function adjustInventoryStock(id: string, adjustment: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) throw new Error("ไม่พบรายการของ");

  const newQuantity = Math.max(0, item.quantity + adjustment);

  await prisma.inventoryItem.update({
    where: { id },
    data: { quantity: newQuantity }
  });

  revalidatePath("/inventory");
}

export async function deleteInventoryItem(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบรายการสินค้า");
  }

  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
}
