"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getMaintenanceTickets(branchId?: string, status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const branchAccess = branchId 
    ? { id: branchId } 
    : session.role === "OWNER" 
      ? {} 
      : { id: { in: session.branchIds } };

  const tickets = await prisma.maintenanceTicket.findMany({
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
      reportedBy: {
        select: { name: true }
      },
      assignedTo: {
        select: { name: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return tickets;
}

export async function createMaintenanceTicket(data: {
  roomId: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedToId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!data.title.trim()) throw new Error("กรุณาระบุหัวข้อแจ้งซ่อม");
  if (!data.roomId) throw new Error("กรุณาระบุห้องพัก");

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      roomId: data.roomId,
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority,
      reportedById: session.userId,
      assignedToId: data.assignedToId || null,
      status: "OPEN"
    }
  });

  // Automatically update room status to MAINTENANCE if priority is HIGH or URGENT
  if (data.priority === "HIGH" || data.priority === "URGENT") {
    await prisma.room.update({
      where: { id: data.roomId },
      data: { status: "MAINTENANCE" }
    });
  }

  revalidatePath("/maintenance");
  return ticket;
}

export async function updateMaintenanceTicket(
  id: string,
  data: {
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    cost?: number;
    assignedToId?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: { room: true }
  });

  if (!ticket) throw new Error("ไม่พบรายการแจ้งซ่อมนี้");

  const isResolving = data.status === "RESOLVED" || data.status === "CLOSED";

  await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status: data.status,
      priority: data.priority,
      cost: data.cost,
      assignedToId: data.assignedToId,
      resolvedAt: isResolving && !ticket.resolvedAt ? new Date() : undefined
    }
  });

  // If resolving and room was in maintenance, check if there are other open tickets
  if (isResolving && ticket.room.status === "MAINTENANCE") {
    const otherOpenTickets = await prisma.maintenanceTicket.count({
      where: {
        roomId: ticket.roomId,
        id: { not: id },
        status: { in: ["OPEN", "IN_PROGRESS"] }
      }
    });

    if (otherOpenTickets === 0) {
      await prisma.room.update({
        where: { id: ticket.roomId },
        data: { status: "AVAILABLE" }
      });
    }
  }

  revalidatePath("/maintenance");
}

export async function deleteMaintenanceTicket(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role === "STAFF" || session.role === "HOUSEKEEPER") {
    throw new Error("ไม่มีสิทธิ์ลบรายการแจ้งซ่อม");
  }

  await prisma.maintenanceTicket.delete({ where: { id } });
  revalidatePath("/maintenance");
}
