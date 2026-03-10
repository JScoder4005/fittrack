"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BodyStat } from "@/types";

export function useBodyStats() {
  return useQuery<BodyStat[]>({
    queryKey: ["body-stats"],
    queryFn: () => api.get("/body-stats").then((r) => r.data),
  });
}

export function useCreateBodyStat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { weight: number; height?: number; bodyFat?: number; recordedAt?: string }) =>
      api.post<BodyStat>("/body-stats", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-stats"] });
      toast.success("Body stats logged!");
    },
  });
}

export function useDeleteBodyStat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/body-stats/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-stats"] });
      toast.success("Entry deleted.");
    },
  });
}
