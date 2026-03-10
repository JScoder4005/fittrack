import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const workoutSchema = z.object({
  goalId: z.string().optional().nullable(),
  exerciseName: z.string().min(1),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  weightUnit: z.string().optional().default("kg"),
  duration: z.number().int().positive().optional().nullable(),
  calories: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");
  const limit = parseInt(searchParams.get("limit") || "50");

  const workouts = await db.workoutLog.findMany({
    where: {
      userId: session.user.id,
      ...(goalId ? { goalId } : {}),
    },
    include: {
      goal: { select: { id: true, title: true, type: true } },
    },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });

  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = workoutSchema.parse(body);

    const workout = await db.workoutLog.create({
      data: {
        ...data,
        userId: session.user.id,
        loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
      },
      include: {
        goal: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
