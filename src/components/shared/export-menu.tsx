"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/export";
import { toast } from "sonner";

type ExportType = "workouts" | "goals" | "progress" | "body-stats";

const exportOptions: { type: ExportType; label: string; filename: string }[] = [
  { type: "workouts", label: "Workouts", filename: "fittrack-workouts" },
  { type: "goals", label: "Goals", filename: "fittrack-goals" },
  { type: "progress", label: "Progress Entries", filename: "fittrack-progress" },
  { type: "body-stats", label: "Body Stats", filename: "fittrack-body-stats" },
];

export function ExportMenu() {
  const [loading, setLoading] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType, filename: string) => {
    setLoading(type);
    try {
      const res = await api.get<Record<string, unknown>[]>(`/export?type=${type}`);
      if (res.data.length === 0) {
        toast.info(`No ${type} data to export`);
        return;
      }
      downloadCSV(res.data, filename);
      toast.success(`${filename}.csv downloaded!`);
    } catch {
      // Error toast handled by Axios interceptor
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Download as CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map(({ type, label, filename }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => handleExport(type, filename)}
            disabled={loading !== null}
          >
            {loading === type ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
