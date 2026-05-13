"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getCustomersForDropdown() {
  const session = await getSession();
  if (!session) return [];

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return customers;
}

export async function getAvailableBranches() {
  const session = await getSession();
  if (!session) return [];

  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { id: { in: session.branchIds } };

  const branches = await prisma.branch.findMany({
    where: { isActive: true, ...branchAccess },
    include: { property: true },
    orderBy: { name: "asc" },
  });

  return branches.map((b) => ({
    id: b.id,
    name: `${b.property.name} ${b.name}`,
  }));
}

export async function getRoomsForDropdown() {
  const session = await getSession();
  if (!session) return [];

  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  const rooms = await prisma.room.findMany({
    where: branchAccess,
    select: { 
      id: true, 
      number: true, 
      branch: { select: { name: true } } 
    },
    orderBy: [{ branchId: "asc" }, { number: "asc" }],
  });

  return rooms.map(r => ({
    id: r.id,
    label: `ห้อง ${r.number} (${r.branch.name})`
  }));
}

export async function quickCreateCustomer(data: { name: string; phone?: string; email?: string; idCard?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อลูกค้า");

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      idCard: data.idCard?.trim() || null,
    },
  });

  return { id: customer.id, name: customer.name };
}
