import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { GoalDetailClient } from "@/components/shared/goal-detail-client";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const goal = await db.goal.findFirst({
    where: { id, userId },
    include: {
      workoutLogs: { orderBy: { loggedAt: "desc" }, take: 20 },
      progressEntries: { orderBy: { recordedAt: "asc" } },
    },
  });

  if (!goal) notFound();

  return <GoalDetailClient goal={JSON.parse(JSON.stringify(goal))} />;
}
