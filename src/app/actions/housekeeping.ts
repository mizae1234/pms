"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getHousekeepingTasks(date: Date, branchId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Determine branch access
  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const tasks = await prisma.housekeepingTask.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      room: {
        branch: branchAccess
      }
    },
    include: {
      room: {
        select: { id: true, number: true, status: true, floor: true, branch: { select: { id: true, name: true } } }
      },
      assignedTo: {
        select: { id: true, name: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { room: { number: 'asc' } }
    ]
  });

  return tasks;
}

export async function createHousekeepingTask(data: {
  roomId: string;
  assignedToId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  scheduledDate: Date;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const task = await prisma.housekeepingTask.create({
    data: {
      roomId: data.roomId,
      assignedToId: data.assignedToId,
      priority: data.priority,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
      status: "PENDING",
      checklist: [
        { item: "เปลี่ยนผ้าปูที่นอน", done: false },
        { item: "กวาดและถูพื้น", done: false },
        { item: "ทำความสะอาดห้องน้ำ", done: false },
        { item: "ทิ้งขยะ", done: false },
        { item: "เติมของใช้ (สบู่, แชมพู)", done: false }
      ]
    }
  });

  // Update room status to CLEANING
  await prisma.room.update({
    where: { id: data.roomId },
    data: { status: "CLEANING" }
  });

  revalidatePath("/housekeeping");
  return task;
}

export async function updateHousekeepingTaskStatus(
  taskId: string, 
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED",
  checklist?: any[]
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const task = await prisma.housekeepingTask.findUnique({
    where: { id: taskId },
    include: { room: true }
  });

  if (!task) throw new Error("ไม่พบงานนี้");

  await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: {
      status,
      checklist: (checklist || task.checklist) as any,
      completedAt: status === "COMPLETED" || status === "VERIFIED" ? new Date() : null
    }
  });

  // If completed, potentially set room to AVAILABLE
  if (status === "COMPLETED" || status === "VERIFIED") {
    // Basic logic: if room was CLEANING, set back to AVAILABLE
    // (In reality, might depend on whether it's OCCUPIED or empty)
    if (task.room.status === "CLEANING") {
      // Check if there's an active booking
      const activeBooking = await prisma.booking.findFirst({
        where: {
          roomId: task.room.id,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkIn: { lte: new Date() },
          checkOut: { gt: new Date() }
        }
      });

      await prisma.room.update({
        where: { id: task.room.id },
        data: { status: activeBooking && activeBooking.status === "CHECKED_IN" ? "OCCUPIED" : "AVAILABLE" }
      });
    }
  }

  revalidatePath("/housekeeping");
}

export async function generateDailyTasks(branchId: string, date: Date) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Get all occupied rooms that don't have tasks for today
  const roomsToClean = await prisma.room.findMany({
    where: {
      branchId,
      status: "OCCUPIED",
      housekeepingTasks: {
        none: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    }
  });

  // 2. Also get rooms that checkout today
  const checkoutBookings = await prisma.booking.findMany({
    where: {
      room: { branchId },
      status: "CHECKED_OUT",
      checkOut: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: { room: true }
  });

  // Combine and deduplicate
  const roomIds = new Set([
    ...roomsToClean.map(r => r.id),
    ...checkoutBookings.map(b => b.roomId)
  ]);

  let count = 0;
  for (const roomId of roomIds) {
    if (!roomId) continue;
    
    // Check if task exists to be safe
    const existing = await prisma.housekeepingTask.findFirst({
      where: {
        roomId,
        scheduledDate: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (!existing) {
      await prisma.housekeepingTask.create({
        data: {
          roomId,
          priority: "MEDIUM",
          scheduledDate: startOfDay,
          status: "PENDING",
          checklist: [
            { item: "เปลี่ยนผ้าปูที่นอน", done: false },
            { item: "กวาดและถูพื้น", done: false },
            { item: "ทำความสะอาดห้องน้ำ", done: false },
            { item: "ทิ้งขยะ", done: false },
            { item: "เติมของใช้ (สบู่, แชมพู)", done: false }
          ]
        }
      });
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "CLEANING" }
      });
      count++;
    }
  }

  revalidatePath("/housekeeping");
  return count;
}
