import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWITDateTime(d: Date = new Date()) {
  const witMs = d.getTime() + (9 * 60 * 60 * 1000);
  const witDate = new Date(witMs);
  
  const yyyy = witDate.getUTCFullYear();
  const mm = String(witDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(witDate.getUTCDate()).padStart(2, '0');
  const hh = String(witDate.getUTCHours()).padStart(2, '0');
  const min = String(witDate.getUTCMinutes()).padStart(2, '0');
  
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`,
    fullDate: witDate
  };
}

export function getWITDate(d: Date = new Date()): Date {
  const witMs = d.getTime() + (9 * 60 * 60 * 1000);
  const witDate = new Date(witMs);
  return new Date(
    witDate.getUTCFullYear(),
    witDate.getUTCMonth(),
    witDate.getUTCDate(),
    witDate.getUTCHours(),
    witDate.getUTCMinutes(),
    witDate.getUTCSeconds(),
    witDate.getUTCMilliseconds()
  );
}

export function parseLocalDate(dateStr: string, timeStr?: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, h || 0, min || 0, 0, 0);
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
