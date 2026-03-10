import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const stat = await db.bodyStat.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bodyStat.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
