"use client";

import { Trophy, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTableRows } from "@/components/ui/skeleton-card";
import { usePersonalBests } from "@/hooks/use-personal-bests";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PersonalBestsClient() {
  const { data: bests = [], isLoading } = usePersonalBests();

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Personal Bests</h1>
        <p className="text-sm text-muted-foreground">Your best performance for each exercise</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            All-Time Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows rows={5} />
          ) : bests.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workouts logged yet"
              description="Log workouts to see your personal bests here"
              action={
                <Button asChild size="sm">
                  <Link href="/workouts">Go to Workouts</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Best Weight</TableHead>
                    <TableHead className="hidden sm:table-cell">Best Reps</TableHead>
                    <TableHead className="hidden md:table-cell">Best Duration</TableHead>
                    <TableHead className="hidden sm:table-cell">Sessions</TableHead>
                    <TableHead>Last Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bests.map((pb) => (
                    <TableRow key={pb.exerciseName}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {pb.exerciseName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pb.maxWeight != null ? (
                          <span className="font-semibold text-primary">
                            {pb.maxWeight} {pb.maxWeightUnit ?? "kg"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {pb.maxReps != null ? (
                          <span>{pb.maxReps} reps</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pb.maxDuration != null ? (
                          <span>{pb.maxDuration} min</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {pb.totalSessions}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(pb.lastLoggedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
