import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(date);
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getDaysUntilDeadline(deadline: Date | string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const GOAL_TYPE_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  CARDIO: "Cardio",
  FLEXIBILITY: "Flexibility",
  NUTRITION: "Nutrition",
  CUSTOM: "Custom",
};

export const GOAL_TYPE_COLORS: Record<string, string> = {
  WEIGHT_LOSS: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MUSCLE_GAIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CARDIO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FLEXIBILITY: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  NUTRITION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CUSTOM: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};
