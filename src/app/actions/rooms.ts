"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface RoomWithBranch {
  id: string;
  number: string;
  floor: number;
  type: string;
  status: string;
  basePrice: number;
  size: number | null;
  branchId: string;
  branchName: string;
  propertyType: string;
  propertyName: string;
}

export interface BranchOption {
  id: string;
  name: string;
  propertyType: string;
}

export interface RoomsData {
  rooms: RoomWithBranch[];
  branches: BranchOption[];
  totalCount: number;
}

export async function getRoomsData(filters?: {
  search?: string;
  branchId?: string;
  floor?: number;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<RoomsData> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 10;

  // Branch filter based on user role
  const branchAccess =
    session.role === "OWNER"
      ? {}
      : { branchId: { in: session.branchIds } };

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isActive: true,
    ...branchAccess,
  };

  if (filters?.search) {
    where.number = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.branchId) {
    where.branchId = filters.branchId;
  }
  if (filters?.floor) {
    where.floor = filters.floor;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  const [rooms, totalCount, branches] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        branch: {
          include: { property: true },
        },
      },
      orderBy: [{ branch: { name: "asc" } }, { floor: "asc" }, { number: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.room.count({ where }),
    prisma.branch.findMany({
      where: branchAccess.branchId ? { id: branchAccess.branchId } : { isActive: true },
      include: { property: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    rooms: rooms.map((r) => ({
      id: r.id,
      number: r.number,
      floor: r.floor,
      type: r.type,
      status: r.status,
      basePrice: r.basePrice,
      size: r.size,
      branchId: r.branchId,
      branchName: `${r.branch.property.name} ${r.branch.name}`,
      propertyType: r.branch.property.type,
      propertyName: r.branch.property.name,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name: `${b.property.name} ${b.name}`,
      propertyType: b.property.type,
    })),
    totalCount,
  };
}

export async function createRoom(data: {
  branchId: string;
  number: string;
  floor: number;
  type: string;
  basePrice: number;
  size?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!["OWNER", "BRANCH_MANAGER"].includes(session.role)) {
    throw new Error("Forbidden");
  }

  return prisma.room.create({
    data: {
      branchId: data.branchId,
      number: data.number,
      floor: data.floor,
      type: data.type as "STANDARD" | "DELUXE" | "SUITE" | "STUDIO" | "ONE_BED" | "TWO_BED" | "PENTHOUSE",
      basePrice: data.basePrice,
      size: data.size,
    },
  });
}

export async function updateRoom(
  id: string,
  data: {
    number?: string;
    floor?: number;
    type?: string;
    status?: string;
    basePrice?: number;
    size?: number;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.room.update({
    where: { id },
    data: {
      ...data,
      type: data.type as "STANDARD" | "DELUXE" | "SUITE" | "STUDIO" | "ONE_BED" | "TWO_BED" | "PENTHOUSE" | undefined,
      status: data.status as "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "OUT_OF_ORDER" | undefined,
    },
  });
}

export async function deleteRoom(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!["OWNER", "BRANCH_MANAGER"].includes(session.role)) {
    throw new Error("Forbidden");
  }

  return prisma.room.update({
    where: { id },
    data: { isActive: false },
  });
}
