// Centralized type definitions for FitTrack

export type GoalType = "WEIGHT_LOSS" | "MUSCLE_GAIN" | "CARDIO" | "FLEXIBILITY" | "NUTRITION" | "CUSTOM";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "ABANDONED";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  status: GoalStatus;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { workoutLogs: number; progressEntries: number };
}

export interface WorkoutLog {
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
  createdAt: string;
  goal: { id: string; title: string; type: string } | null;
}

export interface ProgressEntry {
  id: string;
  value: number;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
  goal?: { title: string; unit: string };
}

export interface GoalWithProgress extends Goal {
  progressEntries: ProgressEntry[];
  workoutLogs?: WorkoutLog[];
  _count: { workoutLogs: number; progressEntries: number };
}

export interface DashboardStats {
  activeGoals: number;
  completedGoals: number;
  workoutsThisWeek: number;
  caloriesThisWeek: number;
  streak: number;
  avgProgress: number;
}

export interface WeeklyDataPoint {
  day: string;
  workouts: number;
  date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  weeklyData: WeeklyDataPoint[];
  recentWorkouts: WorkoutLog[];
  goals: Goal[];
}

export interface BodyStat {
  id: string;
  weight: number;
  height: number | null;
  bodyFat: number | null;
  recordedAt: string;
  createdAt: string;
  bmi?: number | null;
}

export interface PersonalBest {
  exerciseName: string;
  maxWeight: number | null;
  maxWeightUnit: string | null;
  maxReps: number | null;
  maxDuration: number | null;
  totalSessions: number;
  lastLoggedAt: string;
}

export interface GoalSummary {
  id: string;
  title: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string | null;
  status: string;
}
