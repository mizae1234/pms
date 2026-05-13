"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getCustomers(search?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { idCard: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { bookings: true, contracts: true },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers;
}

export async function createCustomer(data: {
  name: string;
  idCard?: string;
  passport?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  address?: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อลูกค้า");

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      idCard: data.idCard?.trim() || null,
      passport: data.passport?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      nationality: data.nationality?.trim() || "TH",
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(
  id: string,
  data: {
    name: string;
    idCard?: string;
    passport?: string;
    phone?: string;
    email?: string;
    nationality?: string;
    address?: string;
    notes?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อลูกค้า");

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name.trim(),
      idCard: data.idCard?.trim() || null,
      passport: data.passport?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      nationality: data.nationality?.trim() || "TH",
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบข้อมูลลูกค้า");
  }

  // Ensure customer has no active bookings or contracts
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { bookings: true, contracts: true } },
    },
  });

  if (!customer) throw new Error("ไม่พบลูกค้า");

  if (customer._count.bookings > 0 || customer._count.contracts > 0) {
    throw new Error("ไม่สามารถลบลูกค้าที่มีประวัติการจองหรือสัญญาเช่าได้");
  }

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/customers");
}
