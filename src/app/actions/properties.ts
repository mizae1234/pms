"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PropertyType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ===== Get all Properties with Branches =====

export async function getAllProperties() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("Forbidden");

  return prisma.property.findMany({
    include: {
      branches: {
        include: {
          _count: { select: { rooms: true, users: true } },
          settings: { select: { electricRate: true, waterRate: true, billingDay: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

// ===== Create new Property =====

export async function createProperty(data: {
  name: string;
  type: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("เฉพาะ Owner เท่านั้น");

  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อโครงการ");

  const property = await prisma.property.create({
    data: {
      name: data.name.trim(),
      type: data.type as PropertyType,
      address: data.address?.trim() || null,
      taxId: data.taxId?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      description: data.description?.trim() || null,
      isSetupComplete: false,
    },
  });

  revalidatePath("/branches");
  return property;
}

// ===== Update Property =====

export async function updateProperty(
  propertyId: string,
  data: {
    name?: string;
    type?: string;
    address?: string;
    taxId?: string;
    phone?: string;
    email?: string;
    description?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("เฉพาะ Owner เท่านั้น");

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.type && { type: data.type as PropertyType }),
      address: data.address?.trim() || null,
      taxId: data.taxId?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      description: data.description?.trim() || null,
    },
  });

  revalidatePath("/branches");
  return property;
}

// ===== Create Branch under a Property =====

export async function createBranch(
  propertyId: string,
  data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("เฉพาะ Owner เท่านั้น");

  if (!data.name.trim()) throw new Error("กรุณาระบุชื่อสาขา");

  // Verify property exists
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error("ไม่พบโครงการ");

  const branch = await prisma.branch.create({
    data: {
      propertyId,
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      isActive: true,
    },
  });

  // Auto-assign current user (OWNER) to branch
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: session.userId, branchId: branch.id } },
    create: { userId: session.userId, branchId: branch.id },
    update: {},
  });

  // Mark property as setup complete (has at least 1 branch)
  if (!property.isSetupComplete) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { isSetupComplete: true },
    });
  }

  revalidatePath("/branches");
  return branch;
}

// ===== Update Branch =====

export async function updateBranch(
  branchId: string,
  data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("เฉพาะ Owner เท่านั้น");

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      address: data.address?.trim() ?? undefined,
      phone: data.phone?.trim() ?? undefined,
      email: data.email?.trim() ?? undefined,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/branches");
  return branch;
}

// ===== Toggle Branch Active =====

export async function toggleBranchActive(branchId: string, isActive: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("เฉพาะ Owner เท่านั้น");

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: { isActive },
  });

  revalidatePath("/branches");
  return branch;
}
