"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PropertyType, RentalMode, RoomType, RoomStatus } from "@/generated/prisma/client";

// ===== Check onboarding status =====

export async function checkOnboardingStatus() {
  const session = await getSession();
  if (!session) return { needsOnboarding: true, reason: "no_session" };

  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, isSetupComplete: true },
  });

  if (!property) return { needsOnboarding: true, reason: "no_property" };
  if (!property.isSetupComplete) return { needsOnboarding: true, reason: "incomplete", propertyId: property.id };

  return { needsOnboarding: false };
}

// ===== Step 1: Create/Update Property =====

export async function savePropertyInfo(data: {
  name: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Check if property already exists
  const existing = await prisma.property.findFirst({ orderBy: { createdAt: "asc" } });

  if (existing) {
    return prisma.property.update({
      where: { id: existing.id },
      data: { name: data.name, address: data.address, taxId: data.taxId, phone: data.phone, email: data.email },
    });
  }

  return prisma.property.create({
    data: {
      name: data.name,
      type: PropertyType.HOTEL, // Will be updated in step 2
      address: data.address,
      taxId: data.taxId,
      phone: data.phone,
      email: data.email,
    },
  });
}

// ===== Step 2: Set Property Type =====

export async function savePropertyType(propertyId: string, type: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.property.update({
    where: { id: propertyId },
    data: { type: type as PropertyType },
  });
}

// ===== Step 3: Create First Branch =====

export async function saveFirstBranch(propertyId: string, data: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Check if branch already exists for this property
  const existing = await prisma.branch.findFirst({ where: { propertyId } });
  
  if (existing) {
    const branch = await prisma.branch.update({
      where: { id: existing.id },
      data: { name: data.name, address: data.address, phone: data.phone, email: data.email },
    });
    return branch;
  }

  const branch = await prisma.branch.create({
    data: {
      propertyId,
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
    },
  });

  // Auto-assign current user to branch
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: session.userId, branchId: branch.id } },
    create: { userId: session.userId, branchId: branch.id },
    update: {},
  });

  return branch;
}

// ===== Step 4: Bulk create rooms (reuse from settings.ts) =====
// Already handled by bulkCreateRooms in settings.ts

// ===== Step 5: Save branch settings (reuse from settings.ts) =====
// Already handled by updateBranchSettings in settings.ts

// ===== Step 6: Save bank account =====

export async function saveBankAccount(branchId: string, data: {
  bankName: string;
  accountName: string;
  accountNo: string;
  promptPay?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.bankAccount.create({
    data: {
      branchId,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNo: data.accountNo,
      promptPay: data.promptPay,
      isDefault: true,
    },
  });
}

// ===== Complete Onboarding =====

export async function completeOnboarding(propertyId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.property.update({
    where: { id: propertyId },
    data: { isSetupComplete: true },
  });
}
