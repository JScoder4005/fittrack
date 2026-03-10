import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProgressClient } from "@/components/shared/progress-client";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [goals, progressEntries] = await Promise.all([
    db.goal.findMany({
      where: { userId },
      include: {
        progressEntries: { orderBy: { recordedAt: "asc" } },
        _count: { select: { workoutLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.progressEntry.findMany({
      where: { userId },
      include: { goal: { select: { title: true, unit: true } } },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <ProgressClient
      goals={JSON.parse(JSON.stringify(goals))}
      recentEntries={JSON.parse(JSON.stringify(progressEntries))}
    />
  );
}
