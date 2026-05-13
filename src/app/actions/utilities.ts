"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getUtilityMeters(branchId: string, periodMonthStr: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const periodMonth = new Date(periodMonthStr);
  periodMonth.setDate(1); // Ensure it's the 1st of the month
  periodMonth.setHours(0, 0, 0, 0);

  // Calculate previous month
  const prevMonth = new Date(periodMonth);
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  // Fetch all rooms for the branch
  const rooms = await prisma.room.findMany({
    where: { branchId },
    select: { id: true, number: true, floor: true, rentalMode: true, status: true },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }]
  });

  // Fetch current month readings
  const currentReadings = await prisma.utilityMeter.findMany({
    where: {
      room: { branchId },
      periodMonth
    }
  });

  // Fetch previous month readings (to calculate units used if not already recorded)
  const previousReadings = await prisma.utilityMeter.findMany({
    where: {
      room: { branchId },
      periodMonth: prevMonth
    }
  });

  // Fetch branch settings for rates
  const settings = await prisma.branchSettings.findUnique({
    where: { branchId }
  });

  const waterRate = settings?.waterRate || 18;
  const electricRate = settings?.electricRate || 8;
  const waterMin = settings?.waterMin || 0;
  const electricMin = settings?.electricMin || 0;

  // Combine data
  const data = rooms.map(room => {
    // Current
    const curWater = currentReadings.find(r => r.roomId === room.id && r.meterType === "WATER");
    const curElectric = currentReadings.find(r => r.roomId === room.id && r.meterType === "ELECTRIC");
    
    // Previous
    const prevWater = previousReadings.find(r => r.roomId === room.id && r.meterType === "WATER");
    const prevElectric = previousReadings.find(r => r.roomId === room.id && r.meterType === "ELECTRIC");

    return {
      room,
      water: {
        id: curWater?.id,
        previous: curWater?.previousReading ?? (prevWater?.currentReading || 0),
        current: curWater?.currentReading || 0,
        unitUsed: curWater?.unitUsed || 0,
        totalAmount: curWater?.totalAmount || 0,
        rate: curWater?.ratePerUnit || waterRate,
        isRecorded: !!curWater
      },
      electric: {
        id: curElectric?.id,
        previous: curElectric?.previousReading ?? (prevElectric?.currentReading || 0),
        current: curElectric?.currentReading || 0,
        unitUsed: curElectric?.unitUsed || 0,
        totalAmount: curElectric?.totalAmount || 0,
        rate: curElectric?.ratePerUnit || electricRate,
        isRecorded: !!curElectric
      }
    };
  });

  return {
    records: data,
    settings: { waterRate, electricRate, waterMin, electricMin }
  };
}

export async function saveUtilityMeter(data: {
  roomId: string;
  meterType: "WATER" | "ELECTRIC";
  periodMonthStr: string;
  previousReading: number;
  currentReading: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const periodMonth = new Date(data.periodMonthStr);
  periodMonth.setDate(1);
  periodMonth.setHours(0, 0, 0, 0);

  // Get room branch to fetch rates
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    select: { branchId: true }
  });
  if (!room) throw new Error("Room not found");

  const settings = await prisma.branchSettings.findUnique({
    where: { branchId: room.branchId }
  });

  const ratePerUnit = data.meterType === "WATER" 
    ? (settings?.waterRate || 18) 
    : (settings?.electricRate || 8);
    
  const minCharge = data.meterType === "WATER"
    ? (settings?.waterMin || 0)
    : (settings?.electricMin || 0);

  const unitUsed = Math.max(0, data.currentReading - data.previousReading);
  const calculatedTotal = unitUsed * ratePerUnit;
  const totalAmount = Math.max(calculatedTotal, minCharge);

  const record = await prisma.utilityMeter.upsert({
    where: {
      roomId_meterType_periodMonth: {
        roomId: data.roomId,
        meterType: data.meterType,
        periodMonth
      }
    },
    update: {
      previousReading: data.previousReading,
      currentReading: data.currentReading,
      unitUsed,
      ratePerUnit,
      totalAmount
    },
    create: {
      roomId: data.roomId,
      meterType: data.meterType,
      periodMonth,
      previousReading: data.previousReading,
      currentReading: data.currentReading,
      unitUsed,
      ratePerUnit,
      totalAmount
    }
  });

  revalidatePath("/utilities");
  return record;
}
