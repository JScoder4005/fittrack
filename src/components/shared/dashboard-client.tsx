"use client";

import { Activity, Target, Dumbbell, Flame, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatRelativeDate, calculateProgress, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";
import Link from "next/link";

interface DashboardStats {
  activeGoals: number;
  completedGoals: number;
  workoutsThisWeek: number;
  caloriesThisWeek: number;
  streak: number;
  avgProgress: number;
}

interface WeeklyDataPoint {
  day: string;
  workouts: number;
  date: string;
}

interface RecentWorkout {
  id: string;
  exerciseName: string;
  duration: number | null;
  calories: number | null;
  loggedAt: string;
  goal: { title: string; type: string } | null;
}

interface GoalSummary {
  id: string;
  title: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
}

interface DashboardClientProps {
  userName: string;
  stats: DashboardStats;
  weeklyData: WeeklyDataPoint[];
  recentWorkouts: RecentWorkout[];
  goals: GoalSummary[];
}

const statCards = [
  { key: "activeGoals", label: "Active Goals", icon: Target, color: "text-blue-500" },
  { key: "workoutsThisWeek", label: "Workouts This Week", icon: Dumbbell, color: "text-green-500" },
  { key: "caloriesThisWeek", label: "Calories Burned", icon: Flame, color: "text-orange-500", suffix: " kcal" },
  { key: "streak", label: "Day Streak", icon: Zap, color: "text-yellow-500", suffix: " days" },
];

export function DashboardClient({ userName, stats, weeklyData, recentWorkouts, goals }: DashboardClientProps) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {stats.avgProgress}% average progress across active goals
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ key, label, icon: Icon, color, suffix }) => (
          <Card key={key} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats[key as keyof DashboardStats].toLocaleString()}
                    {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
                  </p>
                </div>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Weekly Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Activity</CardTitle>
            <CardDescription>Workouts logged per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="workouts" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Goals Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Goals</CardTitle>
              <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <div className="text-center py-6">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active goals</p>
                <Link href="/goals" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Create a goal
                </Link>
              </div>
            ) : (
              goals.map((goal) => {
                const pct = calculateProgress(goal.currentValue, goal.targetValue);
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate pr-2">{goal.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${GOAL_TYPE_COLORS[goal.type]}`}>
                        {GOAL_TYPE_LABELS[goal.type]}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/workouts" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No workouts logged yet</p>
              <Link href="/workouts" className="text-xs text-primary hover:underline mt-1 inline-block">
                Log a workout
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{w.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.goal?.title || "General"} · {formatRelativeDate(w.loggedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {w.duration && <p>{w.duration} min</p>}
                    {w.calories && <p>{w.calories} kcal</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
