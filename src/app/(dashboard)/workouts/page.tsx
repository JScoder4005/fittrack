import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkoutsClient } from "@/components/shared/workouts-client";

export default async function WorkoutsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [workouts, goals] = await Promise.all([
    db.workoutLog.findMany({
      where: { userId },
      include: { goal: { select: { id: true, title: true, type: true } } },
      orderBy: { loggedAt: "desc" },
      take: 50,
    }),
    db.goal.findMany({
      where: { userId, status: "ACTIVE" },
      select: { id: true, title: true, type: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <WorkoutsClient
      workouts={JSON.parse(JSON.stringify(workouts))}
      goals={JSON.parse(JSON.stringify(goals))}
    />
  );
}
