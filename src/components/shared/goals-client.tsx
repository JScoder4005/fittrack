"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Target, Calendar, MoreVertical, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalForm, type GoalFormDefaultValues } from "./goal-form";
import { calculateProgress, getDaysUntilDeadline, formatDate, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import type { Goal } from "@/types";

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("ACTIVE");
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const filtered = goals.filter((g) => (tab === "ALL" ? true : g.status === tab));

  const statusCounts = {
    ACTIVE: goals.filter((g) => g.status === "ACTIVE").length,
    COMPLETED: goals.filter((g) => g.status === "COMPLETED").length,
    ALL: goals.length,
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    await createGoal.mutateAsync(data);
    setCreateOpen(false);
    router.refresh();
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editGoal) return;
    await updateGoal.mutateAsync({ id: editGoal.id, data });
    setEditGoal(null);
    router.refresh();
  };

  const handleComplete = async (id: string) => {
    await updateGoal.mutateAsync({ id, data: { status: "COMPLETED" } });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteGoal.mutateAsync(deleteId);
    setDeleteId(null);
    router.refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {statusCounts.ACTIVE} active goal{statusCounts.ACTIVE !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Active ({statusCounts.ACTIVE})</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed ({statusCounts.COMPLETED})</TabsTrigger>
          <TabsTrigger value="ALL">All ({statusCounts.ALL})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals here"
          description={
            tab === "ACTIVE" ? "Create your first fitness goal to get started" : "No goals in this category"
          }
          action={
            tab === "ACTIVE" ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create Goal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={setEditGoal}
              onComplete={handleComplete}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
            <DialogDescription>Set up a new fitness goal to track</DialogDescription>
          </DialogHeader>
          <GoalForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update your goal details</DialogDescription>
          </DialogHeader>
          {editGoal && (
            <GoalForm
              defaultValues={editGoal as GoalFormDefaultValues}
              onSubmit={handleEdit}
              onCancel={() => setEditGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Goal"
        description="This will permanently delete the goal and all associated data. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleteGoal.isPending}
      />
    </div>
  );
}

// ─── GoalCard sub-component ────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onComplete,
  onDelete,
}: {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pct = calculateProgress(goal.currentValue, goal.targetValue);
  const days = getDaysUntilDeadline(goal.deadline);

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <Badge variant="secondary" className={`text-xs ${GOAL_TYPE_COLORS[goal.type]}`}>
              {GOAL_TYPE_LABELS[goal.type]}
            </Badge>
            <h3 className="font-semibold truncate">{goal.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              {goal.status === "ACTIVE" && (
                <DropdownMenuItem onClick={() => onComplete(goal.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(goal.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{goal._count?.workoutLogs ?? 0} workouts</span>
          {goal.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={days !== null && days < 7 ? "text-destructive font-medium" : ""}>
                {days !== null ? (days > 0 ? `${days}d left` : "Overdue") : formatDate(goal.deadline)}
              </span>
            </div>
          )}
        </div>

        <Link href={`/goals/${goal.id}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
