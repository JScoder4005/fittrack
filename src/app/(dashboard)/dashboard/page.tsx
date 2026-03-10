import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/shared/dashboard-client";
import { startOfWeek, endOfWeek, subDays } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [activeGoals, completedGoals, workoutsThisWeek, recentWorkouts, caloriesResult, goals] =
    await Promise.all([
      db.goal.count({ where: { userId, status: "ACTIVE" } }),
      db.goal.count({ where: { userId, status: "COMPLETED" } }),
      db.workoutLog.count({ where: { userId, loggedAt: { gte: weekStart, lte: weekEnd } } }),
      db.workoutLog.findMany({
        where: { userId },
        include: { goal: { select: { title: true, type: true } } },
        orderBy: { loggedAt: "desc" },
        take: 6,
      }),
      db.workoutLog.aggregate({
        where: { userId, loggedAt: { gte: weekStart, lte: weekEnd } },
        _sum: { calories: true },
      }),
      db.goal.findMany({
        where: { userId, status: "ACTIVE" },
        select: { id: true, title: true, type: true, currentValue: true, targetValue: true, unit: true, deadline: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  // Last 7 days chart data
  const weeklyData = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      const count = await db.workoutLog.count({
        where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
      });
      return {
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        workouts: count,
        date: dayStart.toISOString(),
      };
    })
  );

  // Streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = subDays(now, i);
    const ds = new Date(day); ds.setHours(0, 0, 0, 0);
    const de = new Date(day); de.setHours(23, 59, 59, 999);
    const cnt = await db.workoutLog.count({ where: { userId, loggedAt: { gte: ds, lte: de } } });
    if (cnt === 0) break;
    streak++;
  }

  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((a: number, g) => a + Math.min((g.currentValue / g.targetValue) * 100, 100), 0) / goals.length)
      : 0;

  return (
    <DashboardClient
      userName={session!.user?.name || "Athlete"}
      stats={{ activeGoals, completedGoals, workoutsThisWeek, caloriesThisWeek: caloriesResult._sum.calories || 0, streak, avgProgress }}
      weeklyData={weeklyData}
      recentWorkouts={JSON.parse(JSON.stringify(recentWorkouts))}
      goals={JSON.parse(JSON.stringify(goals))}
    />
  );
}
