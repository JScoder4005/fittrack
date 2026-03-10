"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div>
        <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Something went wrong. Please try again.</p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
