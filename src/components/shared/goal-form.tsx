"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod/v4";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  type: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "CARDIO", "FLEXIBILITY", "NUTRITION", "CUSTOM"]),
  targetValue: z.number({ error: "Must be a positive number" }).positive("Must be positive"),
  currentValue: z.number().optional(),
  unit: z.string().min(1, "Unit required"),
  deadline: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
export type GoalFormDefaultValues = Partial<FormData & { id: string; status: string }>;

const GOAL_TYPES = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "CARDIO", label: "Cardio" },
  { value: "FLEXIBILITY", label: "Flexibility" },
  { value: "NUTRITION", label: "Nutrition" },
  { value: "CUSTOM", label: "Custom" },
];

const UNIT_PRESETS: Record<string, string[]> = {
  WEIGHT_LOSS: ["kg", "lbs"],
  MUSCLE_GAIN: ["kg", "lbs", "reps"],
  CARDIO: ["km", "miles", "minutes", "steps"],
  FLEXIBILITY: ["cm", "inches", "degrees"],
  NUTRITION: ["kcal", "g protein", "glasses"],
  CUSTOM: ["reps", "minutes", "km", "kg", "sessions"],
};

interface GoalFormProps {
  defaultValues?: GoalFormDefaultValues;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({ defaultValues, onSubmit, onCancel }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      type: defaultValues?.type as FormData["type"] || "CUSTOM",
      targetValue: defaultValues?.targetValue,
      currentValue: defaultValues?.currentValue || 0,
      unit: defaultValues?.unit || "",
      deadline: defaultValues?.deadline
        ? new Date(defaultValues.deadline).toISOString().slice(0, 10)
        : "",
    },
  });

  const goalType = watch("type");
  const unitOptions = UNIT_PRESETS[goalType] || UNIT_PRESETS.CUSTOM;

  return (
    <form onSubmit={handleSubmit(onSubmit as (d: FormData) => void | Promise<void>)} className="space-y-4">
      <div className="space-y-1">
        <Label>Goal Title</Label>
        <Input placeholder="e.g. Lose 5kg by summer" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Type</Label>
        <Select
          defaultValue={defaultValues?.type || "CUSTOM"}
          onValueChange={(v) => setValue("type", v as FormData["type"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GOAL_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Target Value</Label>
          <Input type="number" step="0.1" placeholder="e.g. 75" {...register("targetValue", { valueAsNumber: true })} />
          {errors.targetValue && <p className="text-xs text-destructive">{errors.targetValue.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Unit</Label>
          <Select
            defaultValue={defaultValues?.unit}
            onValueChange={(v) => setValue("unit", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Or type custom unit"
            {...register("unit")}
            className="mt-1"
          />
          {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Current Value</Label>
          <Input type="number" step="0.1" placeholder="0" {...register("currentValue", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1">
          <Label>Deadline (optional)</Label>
          <Input type="date" {...register("deadline")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description (optional)</Label>
        <Textarea rows={2} placeholder="Any notes about this goal..." {...register("description")} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {defaultValues?.id ? "Save Changes" : "Create Goal"}
        </Button>
      </div>
    </form>
  );
}
