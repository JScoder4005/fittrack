"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { GoalProgressCard } from "@/components/ui/goal-progress-card";
import { EmptyState } from "@/components/ui/empty-state";
import { chartTooltipStyle } from "@/components/ui/chart-tooltip";
import { SkeletonChart } from "@/components/ui/skeleton-card";
import { calculateProgress, formatRelativeDate } from "@/lib/utils";
import type { GoalWithProgress, ProgressEntry } from "@/types";

// Dynamic imports for Recharts charts
const DynamicProgressChart = dynamic(
  () => import("recharts").then((m) => {
    const {
      LineChart, Line, BarChart, Bar,
      XAxis, YAxis, CartesianGrid, Tooltip,
      ResponsiveContainer, Legend,
    } = m;

    return function ProgressChart({
      data,
      chartType,
      targetValue,
    }: {
      data: { date: string; value: number; target: number }[];
      chartType: "line" | "bar";
      targetValue: number;
    }) {
      if (data.length === 0) return null;
      return (
        <ResponsiveContainer width="100%" height={220}>
          {chartType === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} name="Progress" />
              <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-2))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Target" />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Progress" />
            </BarChart>
          )}
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <SkeletonChart /> }
);

interface GoalWithProgressEntry {
  id: string;
  title: string;
  type: string;
  status: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  progressEntries: Array<{ id: string; value: number; notes: string | null; recordedAt: string }>;
  _count: { workoutLogs: number };
}

interface RecentEntry {
  id: string;
  value: number;
  notes: string | null;
  recordedAt: string;
  goal: { title: string; unit: string };
}

export function ProgressClient({
  goals,
  recentEntries,
}: {
  goals: GoalWithProgressEntry[];
  recentEntries: RecentEntry[];
}) {
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || "");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const chartData =
    selectedGoal?.progressEntries.map((e) => ({
      date: new Date(e.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: e.value,
      target: selectedGoal.targetValue,
    })) || [];

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  const overallStats = {
    avgProgress: activeGoals.length
      ? Math.round(
          activeGoals.reduce(
            (a, g) => a + calculateProgress(g.currentValue, g.targetValue),
            0
          ) / activeGoals.length
        )
      : 0,
    totalWorkouts: goals.reduce((a, g) => a + g._count.workoutLogs, 0),
    completed: completedGoals.length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Track your fitness journey over time</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Progress" value={`${overallStats.avgProgress}%`} icon={TrendingUp} />
        <StatCard label="Total Workouts" value={overallStats.totalWorkouts} icon={Target} />
        <StatCard label="Goals Completed" value={overallStats.completed} icon={Calendar} />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No progress data yet"
          description="Create goals and log progress to see charts here"
          action={
            <Link href="/goals">
              <Badge variant="outline" className="cursor-pointer">
                Go to Goals →
              </Badge>
            </Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Goal Selector + Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Progress Chart</CardTitle>
                <Tabs value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar")}>
                  <TabsList className="h-7">
                    <TabsTrigger value="line" className="text-xs px-2 h-6">Line</TabsTrigger>
                    <TabsTrigger value="bar" className="text-xs px-2 h-6">Bar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {goals.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {goals.map((g) => (
                    <Badge
                      key={g.id}
                      variant={selectedGoalId === g.id ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedGoalId(g.id)}
                    >
                      {g.title.slice(0, 20)}
                    </Badge>
                  ))}
                </div>
              )}
              {selectedGoal && (
                <CardDescription className="mt-1">
                  {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                  {" "}· {calculateProgress(selectedGoal.currentValue, selectedGoal.targetValue)}%
                  complete
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">No progress entries for this goal</p>
                    <Link
                      href={`/goals/${selectedGoalId}`}
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Log progress →
                    </Link>
                  </div>
                </div>
              ) : (
                <DynamicProgressChart
                  data={chartData}
                  chartType={chartType}
                  targetValue={selectedGoal?.targetValue ?? 0}
                />
              )}
            </CardContent>
          </Card>

          {/* All Goals Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.map((g) => (
                <GoalProgressCard
                  key={g.id}
                  id={g.id}
                  title={g.title}
                  type={g.type}
                  currentValue={g.currentValue}
                  targetValue={g.targetValue}
                  unit={g.unit}
                  onClick={() => setSelectedGoalId(g.id)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Progress Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Progress Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{entry.goal.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.notes || "No notes"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {entry.value} {entry.goal.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(entry.recordedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
