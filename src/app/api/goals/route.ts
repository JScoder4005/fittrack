import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "CARDIO", "FLEXIBILITY", "NUTRITION", "CUSTOM"]),
  targetValue: z.number().positive(),
  currentValue: z.number().optional().default(0),
  unit: z.string().min(1),
  deadline: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const goals = await db.goal.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as "ACTIVE" | "COMPLETED" | "PAUSED" | "ABANDONED" } : {}),
    },
    include: {
      _count: { select: { workoutLogs: true, progressEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = goalSchema.parse(body);

    const goal = await db.goal.create({
      data: {
        ...data,
        userId: session.user.id,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
