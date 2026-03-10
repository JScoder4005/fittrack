"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { Plus, Dumbbell, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeDate, GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from "@/lib/utils";

const workoutSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name required"),
  goalId: z.string().optional(),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.string(),
  duration: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
});

type WorkoutForm = z.infer<typeof workoutSchema>;

interface Workout {
  id: string;
  exerciseName: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
  duration: number | null;
  calories: number | null;
  notes: string | null;
  loggedAt: string;
  goal: { id: string; title: string; type: string } | null;
}

interface Goal {
  id: string;
  title: string;
  type: string;
}

export function WorkoutsClient({ workouts: initial, goals }: { workouts: Workout[]; goals: Goal[] }) {
  const searchParams = useSearchParams();
  const preselectedGoalId = searchParams.get("goalId") || "";

  const [workouts, setWorkouts] = useState(initial);
  const [logOpen, setLogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutForm>({
    resolver: standardSchemaResolver(workoutSchema),
    defaultValues: { weightUnit: "kg", goalId: preselectedGoalId },
  });

  useEffect(() => {
    if (preselectedGoalId) {
      setLogOpen(true);
    }
  }, [preselectedGoalId]);

  const onSubmit = async (data: WorkoutForm) => {
    const clean = {
      ...data,
      goalId: data.goalId || undefined,
      loggedAt: data.loggedAt || new Date().toISOString(),
    };

    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });

    if (res.ok) {
      const workout = await res.json();
      setWorkouts((prev) => [workout, ...prev]);
      reset({ weightUnit: "kg" });
      setLogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/workouts/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setWorkouts((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
    }
  };

  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-sm text-muted-foreground">{workouts.length} logged</p>
        </div>
        <Button onClick={() => setLogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Log Workout
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Logged", value: workouts.length, suffix: "" },
          { label: "Total Duration", value: totalDuration, suffix: " min" },
          { label: "Calories Burned", value: totalCalories, suffix: " kcal" },
        ].map(({ label, value, suffix }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-1">{value.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">{suffix}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workout Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No workouts logged yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="hidden sm:table-cell">Goal</TableHead>
                    <TableHead className="hidden md:table-cell">Sets/Reps</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead className="hidden sm:table-cell">Calories</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workouts.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">
                        <div>{w.exerciseName}</div>
                        {w.weight && <div className="text-xs text-muted-foreground">{w.weight}{w.weightUnit}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {w.goal ? (
                          <Badge variant="secondary" className={`text-xs ${GOAL_TYPE_COLORS[w.goal.type]}`}>
                            {w.goal.title.slice(0, 20)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {[w.sets && `${w.sets}×${w.reps || "?"}`].filter(Boolean).join("") || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {w.duration ? `${w.duration} min` : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {w.calories ? `${w.calories} kcal` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeDate(w.loggedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(w.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Workout Dialog */}
      <Dialog open={logOpen} onOpenChange={(o) => { setLogOpen(o); if (!o) reset({ weightUnit: "kg" }); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
            <DialogDescription>Record your exercise details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Exercise Name</Label>
              <Input placeholder="e.g. Bench Press, Running, Yoga" {...register("exerciseName")} />
              {errors.exerciseName && <p className="text-xs text-destructive">{errors.exerciseName.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Goal (optional)</Label>
              <Select defaultValue={preselectedGoalId} onValueChange={(v) => setValue("goalId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Sets</Label>
                <Input type="number" placeholder="e.g. 3" {...register("sets", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Reps</Label>
                <Input type="number" placeholder="e.g. 12" {...register("reps", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.5" placeholder="e.g. 60" {...register("weight", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Duration (min)</Label>
                <Input type="number" placeholder="e.g. 30" {...register("duration", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Calories</Label>
                <Input type="number" placeholder="e.g. 250" {...register("calories", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="datetime-local" {...register("loggedAt")} />
            </div>

            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="How was the workout?" {...register("notes")} />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Workout
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Workout</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this workout log?</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
