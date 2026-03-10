"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";
import { calculateProgress, formatDate, formatRelativeDate, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";

interface ProgressEntry {
  id: string;
  value: number;
  notes: string | null;
  recordedAt: string;
}

interface GoalWithProgress {
  id: string;
  title: string;
  type: string;
  status: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  progressEntries: ProgressEntry[];
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
  goals: GoalWithProgress[];
  recentEntries: RecentEntry[];
}) {
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || "");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const chartData = selectedGoal?.progressEntries.map((e) => ({
    date: new Date(e.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: e.value,
    target: selectedGoal.targetValue,
  })) || [];

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  const overallStats = {
    avgProgress: activeGoals.length
      ? Math.round(activeGoals.reduce((a, g) => a + calculateProgress(g.currentValue, g.targetValue), 0) / activeGoals.length)
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
        {[
          { label: "Avg Progress", value: `${overallStats.avgProgress}%`, icon: TrendingUp },
          { label: "Total Workouts", value: overallStats.totalWorkouts, icon: Target },
          { label: "Goals Completed", value: overallStats.completed, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No progress data yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create goals and log progress to see charts here</p>
          <Link href="/goals">
            <Badge variant="outline" className="cursor-pointer">Go to Goals →</Badge>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Goal Selector + Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Progress Chart</CardTitle>
                <div className="flex gap-2">
                  <Tabs value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar")}>
                    <TabsList className="h-7">
                      <TabsTrigger value="line" className="text-xs px-2 h-6">Line</TabsTrigger>
                      <TabsTrigger value="bar" className="text-xs px-2 h-6">Bar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
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
                  {" "}· {calculateProgress(selectedGoal.currentValue, selectedGoal.targetValue)}% complete
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No progress entries for this goal</p>
                    <Link href={`/goals/${selectedGoalId}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                      Log progress →
                    </Link>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  {chartType === "line" ? (
                    <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} name="Progress" />
                      <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-2))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Target" />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Progress" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* All Goals Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.map((g) => {
                const pct = calculateProgress(g.currentValue, g.targetValue);
                return (
                  <div key={g.id} className="space-y-1 cursor-pointer" onClick={() => setSelectedGoalId(g.id)}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate pr-1">{g.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${GOAL_TYPE_COLORS[g.type]}`}>
                        {GOAL_TYPE_LABELS[g.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {g.currentValue}/{g.targetValue} {g.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{entry.goal.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.notes || "No notes"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{entry.value} {entry.goal.unit}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(entry.recordedAt)}</p>
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
