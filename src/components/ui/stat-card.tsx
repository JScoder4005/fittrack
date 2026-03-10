import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, suffix, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">
              {typeof value === "number" ? value.toLocaleString() : value}
              {suffix && (
                <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
              )}
            </p>
          </div>
          {Icon && <Icon className={`h-5 w-5 shrink-0 ${iconColor ?? "text-muted-foreground"}`} />}
        </div>
      </CardContent>
    </Card>
  );
}
