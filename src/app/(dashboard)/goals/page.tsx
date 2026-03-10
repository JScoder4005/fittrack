import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalsClient } from "@/components/shared/goals-client";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const goals = await db.goal.findMany({
    where: { userId },
    include: {
      _count: { select: { workoutLogs: true, progressEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <GoalsClient goals={JSON.parse(JSON.stringify(goals))} />;
}
