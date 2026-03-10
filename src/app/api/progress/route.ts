import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const progressSchema = z.object({
  goalId: z.string().min(1),
  value: z.number(),
  notes: z.string().optional().nullable(),
  recordedAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");

  const entries = await db.progressEntry.findMany({
    where: {
      userId: session.user.id,
      ...(goalId ? { goalId } : {}),
    },
    include: {
      goal: { select: { id: true, title: true, unit: true, targetValue: true } },
    },
    orderBy: { recordedAt: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = progressSchema.parse(body);

    // Verify goal belongs to user
    const goal = await db.goal.findFirst({
      where: { id: data.goalId, userId: session.user.id },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const entry = await db.progressEntry.create({
      data: {
        userId: session.user.id,
        goalId: data.goalId,
        value: data.value,
        notes: data.notes,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      },
    });

    // Update goal's currentValue
    await db.goal.update({
      where: { id: data.goalId },
      data: { currentValue: data.value },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
