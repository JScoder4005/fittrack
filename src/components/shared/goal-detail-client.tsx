"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Plus, TrendingUp, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chartTooltipStyle } from "@/components/ui/chart-tooltip";
import { SkeletonChart } from "@/components/ui/skeleton-card";
import { calculateProgress, formatDate, formatRelativeDate, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";
import { useLogProgress } from "@/hooks/use-progress";

// Dynamic import for Recharts
const DynamicLineChart = dynamic(
  () => import("recharts").then((m) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } = m;
    return function GoalLineChart({
      data,
      targetValue,
    }: {
      data: { date: string; value: number; target: number }[];
      targetValue: number;
    }) {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <ReferenceLine
              y={targetValue}
              stroke="hsl(var(--chart-2))"
              strokeDasharray="4 4"
              label={{ value: "Target", fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <SkeletonChart /> }
);

interface ProgressEntry {
  id: string;
  value: number;
  notes: string | null;
  recordedAt: string;
}

interface WorkoutLog {
  id: string;
  exerciseName: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  calories: number | null;
  notes: string | null;
  loggedAt: string;
}

interface GoalDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  createdAt: string;
  progressEntries: ProgressEntry[];
  workoutLogs: WorkoutLog[];
}

export function GoalDetailClient({ goal: initialGoal }: { goal: GoalDetail }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [progressNotes, setProgressNotes] = useState("");

  const logProgress = useLogProgress();

  const pct = calculateProgress(goal.currentValue, goal.targetValue);

  const chartData = goal.progressEntries.map((e) => ({
    date: new Date(e.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: e.value,
    target: goal.targetValue,
  }));

  const handleLogProgress = async () => {
    if (!progressValue) return;
    const entry = await logProgress.mutateAsync({
      goalId: goal.id,
      value: parseFloat(progressValue),
      notes: progressNotes || undefined,
    });
    setGoal((prev) => ({
      ...prev,
      currentValue: parseFloat(progressValue),
      progressEntries: [...prev.progressEntries, entry],
    }));
    setProgressValue("");
    setProgressNotes("");
    setProgressOpen(false);
    router.refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/goals">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{goal.title}</h1>
            <Badge variant="secondary" className={GOAL_TYPE_COLORS[goal.type]}>
              {GOAL_TYPE_LABELS[goal.type]}
            </Badge>
          </div>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>
          )}
        </div>
        <Button size="sm" onClick={() => setProgressOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Progress
        </Button>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold">
                {goal.currentValue}{" "}
                <span className="text-lg text-muted-foreground font-normal">{goal.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                of {goal.targetValue} {goal.unit} target
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{pct}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
          </div>
          <Progress value={pct} className="h-3" />
          {goal.deadline && (
            <p className="text-xs text-muted-foreground mt-2">
              Deadline: {formatDate(goal.deadline)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicLineChart data={chartData} targetValue={goal.targetValue} />
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4" /> Workout History
            </CardTitle>
            <Link href={`/workouts?goalId=${goal.id}`}>
              <Button variant="outline" size="sm">Log Workout</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {goal.workoutLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workouts logged for this goal yet
            </p>
          ) : (
            <div className="space-y-2">
              {goal.workoutLogs.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div>
                    <p className="font-medium">{w.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        w.sets && `${w.sets} sets`,
                        w.reps && `${w.reps} reps`,
                        w.weight && `${w.weight}kg`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {w.duration && <p>{w.duration} min</p>}
                    <p>{formatRelativeDate(w.loggedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Progress Dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Progress</DialogTitle>
            <DialogDescription>Update your current value for this goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Current Value ({goal.unit})</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={`e.g. ${goal.currentValue}`}
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea
                rows={2}
                placeholder="How are you feeling?"
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setProgressOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLogProgress}
                disabled={!progressValue || logProgress.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
