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
import { GoalForm, type GoalFormDefaultValues } from "./goal-form";
import { calculateProgress, getDaysUntilDeadline, formatDate, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  createdAt: string;
  _count: { workoutLogs: number; progressEntries: number };
}

export function GoalsClient({ goals: initialGoals }: { goals: Goal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [tab, setTab] = useState("ACTIVE");
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = goals.filter((g) =>
    tab === "ALL" ? true : g.status === tab
  );

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const goal = await res.json();
      setGoals((prev) => [{ ...goal, _count: { workoutLogs: 0, progressEntries: 0 } }, ...prev]);
      setCreateOpen(false);
      router.refresh();
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editGoal) return;
    const res = await fetch(`/api/goals/${editGoal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setGoals((prev) => prev.map((g) => (g.id === editGoal.id ? { ...updated, _count: g._count } : g)));
      setEditGoal(null);
    }
  };

  const handleComplete = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (res.ok) {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "COMPLETED" } : g)));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/goals/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
    }
  };

  const statusCounts = {
    ACTIVE: goals.filter((g) => g.status === "ACTIVE").length,
    COMPLETED: goals.filter((g) => g.status === "COMPLETED").length,
    ALL: goals.length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">{statusCounts.ACTIVE} active goal{statusCounts.ACTIVE !== 1 ? "s" : ""}</p>
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
        <div className="text-center py-16">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No goals here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tab === "ACTIVE" ? "Create your first fitness goal to get started" : "No goals in this category"}
          </p>
          {tab === "ACTIVE" && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((goal) => {
            const pct = calculateProgress(goal.currentValue, goal.targetValue);
            const days = getDaysUntilDeadline(goal.deadline);
            return (
              <Card key={goal.id} className="group relative hover:shadow-md transition-shadow">
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditGoal(goal)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {goal.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleComplete(goal.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(goal.id)}>
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
                    <div className="flex items-center gap-3">
                      <span>{goal._count.workoutLogs} workouts</span>
                    </div>
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
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
            <DialogDescription>Set up a new fitness goal to track</DialogDescription>
          </DialogHeader>
          <GoalForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
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
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              This will permanently delete the goal and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
