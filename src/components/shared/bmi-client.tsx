"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Scale, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { chartTooltipStyle } from "@/components/ui/chart-tooltip";
import { SkeletonChart } from "@/components/ui/skeleton-card";
import { useBodyStats, useCreateBodyStat, useDeleteBodyStat } from "@/hooks/use-body-stats";
import { formatDate } from "@/lib/utils";

const DynamicBmiChart = dynamic(
  () => import("recharts").then((m) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } = m;
    return function BmiLineChart({
      data,
    }: {
      data: { date: string; weight: number; bmi: number | null }[];
    }) {
      const bmiData = data.filter((d) => d.bmi !== null);
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            {bmiData.length > 0 && (
              <>
                <ReferenceLine y={18.5} stroke="hsl(var(--chart-3))" strokeDasharray="3 3" label={{ value: "Underweight", fontSize: 10 }} />
                <ReferenceLine y={25} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label={{ value: "Overweight", fontSize: 10 }} />
                <Line type="monotone" dataKey="bmi" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} name="BMI" />
              </>
            )}
            <Line type="monotone" dataKey="weight" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <SkeletonChart /> }
);

const bmiSchema = z.object({
  weight: z.number().positive("Weight must be positive"),
  height: z.number().positive("Height must be positive").optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  recordedAt: z.string().optional(),
});

type BmiFormValues = z.infer<typeof bmiSchema>;

function calcBmi(weight: number, height: number): number {
  const hm = height / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function BmiClient() {
  const [logOpen, setLogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: stats = [], isLoading } = useBodyStats();
  const createStat = useCreateBodyStat();
  const deleteStat = useDeleteBodyStat();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BmiFormValues>({
    resolver: standardSchemaResolver(bmiSchema),
  });

  const onSubmit = async (data: BmiFormValues) => {
    await createStat.mutateAsync(data);
    reset();
    setLogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteStat.mutateAsync(deleteId);
    setDeleteId(null);
  };

  // Latest entry summary
  const latest = stats[stats.length - 1];
  const latestBmi = latest?.height ? calcBmi(latest.weight, latest.height) : null;

  // Chart data
  const chartData = stats.map((s) => ({
    date: new Date(s.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: s.weight,
    bmi: s.height ? calcBmi(s.weight, s.height) : null,
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BMI & Body Stats</h1>
          <p className="text-sm text-muted-foreground">Track your weight, BMI, and body composition</p>
        </div>
        <Button size="sm" onClick={() => setLogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Stats
        </Button>
      </div>

      {/* Summary Cards */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Current Weight" value={latest.weight} suffix=" kg" icon={Scale} iconColor="text-blue-500" />
          <StatCard
            label="BMI"
            value={latestBmi ?? "—"}
            icon={Scale}
            iconColor={
              latestBmi
                ? latestBmi < 18.5
                  ? "text-blue-500"
                  : latestBmi < 25
                  ? "text-green-500"
                  : latestBmi < 30
                  ? "text-orange-500"
                  : "text-red-500"
                : "text-muted-foreground"
            }
          />
          <StatCard
            label="Category"
            value={latestBmi ? getBmiCategory(latestBmi) : "—"}
            icon={Scale}
            iconColor="text-muted-foreground"
          />
        </div>
      )}

      {/* BMI Chart */}
      {stats.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weight & BMI Over Time</CardTitle>
            <CardDescription>
              BMI is calculated when height is provided. Healthy range: 18.5–25
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicBmiChart data={chartData} />
          </CardContent>
        </Card>
      ) : (
        !isLoading && (
          <EmptyState
            icon={Scale}
            title="No body stats logged"
            description="Start logging your weight and height to track BMI over time"
            action={
              <Button onClick={() => setLogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Log First Entry
              </Button>
            }
          />
        )
      )}

      {/* History Table */}
      {stats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead className="hidden sm:table-cell">Height (cm)</TableHead>
                    <TableHead className="hidden sm:table-cell">Body Fat %</TableHead>
                    <TableHead>BMI</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...stats].reverse().map((s) => {
                    const bmi = s.height ? calcBmi(s.weight, s.height) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{formatDate(s.recordedAt)}</TableCell>
                        <TableCell className="font-medium">{s.weight}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {s.height ?? "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {s.bodyFat != null ? `${s.bodyFat}%` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {bmi != null ? (
                            <span
                              className={
                                bmi < 18.5
                                  ? "text-blue-600"
                                  : bmi < 25
                                  ? "text-green-600"
                                  : bmi < 30
                                  ? "text-orange-600"
                                  : "text-red-600"
                              }
                            >
                              {bmi} <span className="text-xs text-muted-foreground">({getBmiCategory(bmi)})</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Stats Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Body Stats</DialogTitle>
            <DialogDescription>Record your current weight and measurements</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Weight (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 75.5"
                {...register("weight", { valueAsNumber: true })}
              />
              {errors.weight && <p className="text-xs text-destructive">{errors.weight.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Height (cm) — for BMI calculation</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 175"
                {...register("height", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Body Fat % (optional)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 18.5"
                {...register("bodyFat", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="datetime-local" {...register("recordedAt")} />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setLogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createStat.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Entry"
        description="This will permanently delete this body stat entry."
        onConfirm={handleDelete}
        loading={deleteStat.isPending}
      />
    </div>
  );
}
