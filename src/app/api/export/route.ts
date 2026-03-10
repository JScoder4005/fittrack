import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "workouts";

  switch (type) {
    case "workouts": {
      const data = await db.workoutLog.findMany({
        where: { userId },
        include: { goal: { select: { title: true } } },
        orderBy: { loggedAt: "desc" },
      });
      return NextResponse.json(
        data.map((w) => ({
          date: w.loggedAt,
          exercise: w.exerciseName,
          sets: w.sets,
          reps: w.reps,
          weight: w.weight,
          weightUnit: w.weightUnit,
          duration_min: w.duration,
          calories: w.calories,
          goal: w.goal?.title ?? "",
          notes: w.notes ?? "",
        }))
      );
    }

    case "goals": {
      const data = await db.goal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(
        data.map((g) => ({
          title: g.title,
          type: g.type,
          status: g.status,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          unit: g.unit,
          deadline: g.deadline,
          createdAt: g.createdAt,
        }))
      );
    }

    case "progress": {
      const data = await db.progressEntry.findMany({
        where: { userId },
        include: { goal: { select: { title: true, unit: true } } },
        orderBy: { recordedAt: "desc" },
      });
      return NextResponse.json(
        data.map((e) => ({
          date: e.recordedAt,
          goal: e.goal.title,
          value: e.value,
          unit: e.goal.unit,
          notes: e.notes ?? "",
        }))
      );
    }

    case "body-stats": {
      const data = await db.bodyStat.findMany({
        where: { userId },
        orderBy: { recordedAt: "desc" },
      });
      return NextResponse.json(
        data.map((s) => ({
          date: s.recordedAt,
          weight_kg: s.weight,
          height_cm: s.height,
          body_fat_pct: s.bodyFat,
          bmi:
            s.height
              ? Math.round((s.weight / ((s.height / 100) ** 2)) * 10) / 10
              : null,
        }))
      );
    }

    default:
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }
}
