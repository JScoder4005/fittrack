"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProgressEntry } from "@/types";

export function useLogProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { goalId: string; value: number; notes?: string }) =>
      api.post<ProgressEntry>("/progress", data).then((r) => r.data),
    onSuccess: () => {
      // Invalidate any cached queries that may be affected
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Progress logged!");
    },
  });
}
