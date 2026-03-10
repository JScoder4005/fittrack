import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfWeek, endOfWeek, subDays } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [
    activeGoals,
    completedGoals,
    workoutsThisWeek,
    recentWorkouts,
    weeklyCalories,
    goals,
  ] = await Promise.all([
    db.goal.count({ where: { userId, status: "ACTIVE" } }),
    db.goal.count({ where: { userId, status: "COMPLETED" } }),
    db.workoutLog.count({
      where: { userId, loggedAt: { gte: weekStart, lte: weekEnd } },
    }),
    db.workoutLog.findMany({
      where: { userId },
      include: { goal: { select: { title: true, type: true } } },
      orderBy: { loggedAt: "desc" },
      take: 5,
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

  // Weekly workout chart data (last 7 days)
  const weeklyData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999));
      return db.workoutLog
        .count({ where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } } })
        .then((count: number) => ({
          day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
          workouts: count,
          date: dayStart.toISOString(),
        }));
    })
  );

  // Streak calculation
  let streak = 0;
  let checkDate = new Date(now);
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(checkDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999));
    const count = await db.workoutLog.count({
      where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
    });
    if (count === 0) break;
    streak++;
    checkDate = subDays(new Date(dayStart), 1);
  }

  const avgProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (acc: number, g) => acc + Math.min((g.currentValue / g.targetValue) * 100, 100),
            0
          ) / goals.length
        )
      : 0;

  return NextResponse.json({
    stats: {
      activeGoals,
      completedGoals,
      workoutsThisWeek,
      caloriesThisWeek: weeklyCalories._sum.calories || 0,
      streak,
      avgProgress,
    },
    weeklyData,
    recentWorkouts,
    goals,
  });
}
