import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Group by exercise name and get aggregated stats
  const grouped = await db.workoutLog.groupBy({
    by: ["exerciseName"],
    where: { userId },
    _max: { weight: true, reps: true, duration: true },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Get the most recent log date and weight unit for each exercise
  const results = await Promise.all(
    grouped.map(async (g) => {
      const lastLog = await db.workoutLog.findFirst({
        where: { userId, exerciseName: g.exerciseName },
        orderBy: { loggedAt: "desc" },
        select: { loggedAt: true, weightUnit: true },
      });

      return {
        exerciseName: g.exerciseName,
        maxWeight: g._max.weight,
        maxWeightUnit: lastLog?.weightUnit ?? null,
        maxReps: g._max.reps,
        maxDuration: g._max.duration,
        totalSessions: g._count.id,
        lastLoggedAt: lastLog?.loggedAt?.toISOString() ?? new Date().toISOString(),
      };
    })
  );

  return NextResponse.json(results);
}
