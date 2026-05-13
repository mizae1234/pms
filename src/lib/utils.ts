import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const TIMEZONE = "Asia/Bangkok";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    timeZone: TIMEZONE,
  }).format(new Date(date));
}

/**
 * สร้าง Date object ที่ represent เวลาปัจจุบันของ timezone Asia/Bangkok
 * ใช้สำหรับ comparison/display — Prisma จะจัดการ UTC conversion ให้เอง
 */
export function nowBangkok(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE })
  );
}

/**
 * สร้าง Date ที่เป็นจุดเริ่มต้นของวันนี้ (00:00:00) ใน timezone ไทย
 */
export function todayStartBangkok(): Date {
  const now = nowBangkok();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * สร้าง Date ที่เป็นจุดสิ้นสุดของวันนี้ (23:59:59.999) ใน timezone ไทย
 */
export function todayEndBangkok(): Date {
  const now = nowBangkok();
  now.setHours(23, 59, 59, 999);
  return now;
}
