"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PersonalBest } from "@/types";

export function usePersonalBests() {
  return useQuery<PersonalBest[]>({
    queryKey: ["personal-bests"],
    queryFn: () => api.get("/workouts/personal-bests").then((r) => r.data),
  });
}
