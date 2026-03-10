import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { calculateProgress, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";

interface GoalProgressCardProps {
  id: string;
  title: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  onClick?: () => void;
  className?: string;
}

export function GoalProgressCard({
  title,
  type,
  currentValue,
  targetValue,
  unit,
  onClick,
  className = "",
}: GoalProgressCardProps) {
  const pct = calculateProgress(currentValue, targetValue);

  return (
    <div
      className={`space-y-1 ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium truncate pr-1">{title}</p>
        <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${GOAL_TYPE_COLORS[type]}`}>
          {GOAL_TYPE_LABELS[type]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {currentValue}/{targetValue} {unit}
        </span>
      </div>
    </div>
  );
}
