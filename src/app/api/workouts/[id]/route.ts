import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  goalId: z.string().optional().nullable(),
  exerciseName: z.string().min(1).optional(),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  weightUnit: z.string().optional(),
  duration: z.number().int().positive().optional().nullable(),
  calories: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.workoutLog.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const workout = await db.workoutLog.update({
      where: { id },
      data: {
        ...data,
        loggedAt: data.loggedAt ? new Date(data.loggedAt) : undefined,
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.workoutLog.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.workoutLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
