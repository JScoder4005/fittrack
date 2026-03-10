import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "CARDIO", "FLEXIBILITY", "NUTRITION", "CUSTOM"]).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED"]).optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional().nullable(),
});

async function getGoalForUser(id: string, userId: string) {
  return db.goal.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id },
    include: {
      workoutLogs: { orderBy: { loggedAt: "desc" }, take: 10 },
      progressEntries: { orderBy: { recordedAt: "desc" } },
    },
  });

  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(goal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getGoalForUser(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const goal = await db.goal.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
      },
    });

    return NextResponse.json(goal);
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
  const existing = await getGoalForUser(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.goal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
