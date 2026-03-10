import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bodyStatSchema = z.object({
  weight: z.number().positive(),
  height: z.number().positive().optional().nullable(),
  bodyFat: z.number().min(0).max(100).optional().nullable(),
  recordedAt: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await db.bodyStat.findMany({
    where: { userId: session.user.id },
    orderBy: { recordedAt: "asc" },
  });

  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bodyStatSchema.parse(body);

    const stat = await db.bodyStat.create({
      data: {
        userId: session.user.id,
        weight: data.weight,
        height: data.height ?? null,
        bodyFat: data.bodyFat ?? null,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      },
    });

    return NextResponse.json(stat, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
