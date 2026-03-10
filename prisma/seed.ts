// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg");
import bcrypt from "bcryptjs";
import { subDays, subHours } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new (PrismaClient as any)({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.progressEntry.deleteMany();
  await db.workoutLog.deleteMany();
  await db.goal.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  // Create demo user — profile inspired by the Vegetarian IBS Meal Plan
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await db.user.create({
    data: {
      name: "Uday Sharma",
      email: "demo@fittrack.app",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Goals — aligned with the IBS fat-loss plan (29yo male, 81.8kg → target 75.1kg at 18% BF)
  const [weightGoal, cardioGoal, muscleGoal, calorieGoal, customGoal] = await Promise.all([
    db.goal.create({
      data: {
        userId: user.id,
        title: "Lose 6.7 kg (Body Fat)",
        description: "Target body fat from 24.3% to 18%. IBS-friendly vegetarian approach, mild caloric deficit of ~1900 kcal/day.",
        type: "WEIGHT_LOSS",
        status: "ACTIVE",
        targetValue: 75.1,
        currentValue: 80.2,
        unit: "kg",
        startDate: subDays(new Date(), 45),
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    }),
    db.goal.create({
      data: {
        userId: user.id,
        title: "30-Minute Daily Cardio",
        description: "Build aerobic base to aid fat loss. Low-impact to protect herniated disc and sciatica.",
        type: "CARDIO",
        status: "ACTIVE",
        targetValue: 180,
        currentValue: 104,
        unit: "sessions",
        startDate: subDays(new Date(), 45),
        deadline: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      },
    }),
    db.goal.create({
      data: {
        userId: user.id,
        title: "Reach 130g Protein Daily",
        description: "Hit vegetarian protein target (no eggs/meat). Key sources: tofu, paneer, whey isolate, peanut butter.",
        type: "NUTRITION",
        status: "ACTIVE",
        targetValue: 130,
        currentValue: 112,
        unit: "g protein",
        startDate: subDays(new Date(), 30),
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
    db.goal.create({
      data: {
        userId: user.id,
        title: "Build Core Strength",
        description: "Core stability exercises to support herniated disc recovery. Focus on planks, bird-dogs, dead bugs.",
        type: "MUSCLE_GAIN",
        status: "ACTIVE",
        targetValue: 120,
        currentValue: 38,
        unit: "sessions",
        startDate: subDays(new Date(), 20),
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      },
    }),
    db.goal.create({
      data: {
        userId: user.id,
        title: "IBS-Free Streak",
        description: "Track days without IBS flare-ups by following the low-FODMAP vegetarian meal plan.",
        type: "CUSTOM",
        status: "COMPLETED",
        targetValue: 30,
        currentValue: 30,
        unit: "days",
        startDate: subDays(new Date(), 60),
        deadline: subDays(new Date(), 10),
      },
    }),
  ]);

  console.log("✅ Created 5 goals");

  // Workout logs — realistic IBS-friendly workout schedule (last 14 days)
  const workoutData = [
    // Today
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 35, calories: 180, notes: "Fasted morning walk, felt good", daysAgo: 0, hoursAgo: 7 },
    { goalId: muscleGoal.id, exerciseName: "Plank + Bird-Dog Circuit", sets: 3, reps: 10, duration: 20, calories: 85, notes: "Core circuit — 3×planks 45s, 3×bird-dog each side", daysAgo: 0, hoursAgo: 18 },
    // Yesterday
    { goalId: cardioGoal.id, exerciseName: "Cycling (Stationary)", duration: 30, calories: 220, notes: "Moderate pace, heart rate 130-145", daysAgo: 1, hoursAgo: 8 },
    { goalId: muscleGoal.id, exerciseName: "Dead Bug", sets: 3, reps: 12, duration: 15, calories: 60, notes: "Slow controlled movement", daysAgo: 1, hoursAgo: 19 },
    // 2 days ago
    { goalId: cardioGoal.id, exerciseName: "Swimming", duration: 40, calories: 300, notes: "Low-impact, easy on back", daysAgo: 2, hoursAgo: 10 },
    // 3 days ago
    { goalId: muscleGoal.id, exerciseName: "Bird-Dog", sets: 4, reps: 10, duration: 15, calories: 55, notes: "Added resistance band", daysAgo: 3, hoursAgo: 9 },
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 30, calories: 150, notes: "Evening walk after dinner", daysAgo: 3, hoursAgo: 20 },
    // 4 days ago
    { goalId: weightGoal.id, exerciseName: "Tofu Stir-Fry + Brown Rice (Meal Prep)", duration: 25, calories: 0, notes: "Prep for the week — 520 kcal lunch option", daysAgo: 4, hoursAgo: 12 },
    { goalId: cardioGoal.id, exerciseName: "Yoga (Gentle)", duration: 45, calories: 120, notes: "Focus on spinal decompression for sciatica", daysAgo: 4, hoursAgo: 18 },
    // 5 days ago
    { goalId: muscleGoal.id, exerciseName: "Plank", sets: 4, reps: 1, weight: 0, duration: 20, calories: 70, notes: "4×45s holds, working toward 60s", daysAgo: 5, hoursAgo: 8 },
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 35, calories: 175, notes: "Post-lunch walk", daysAgo: 5, hoursAgo: 14 },
    // 6 days ago
    { goalId: cardioGoal.id, exerciseName: "Cycling (Stationary)", duration: 30, calories: 210, notes: "HIIT intervals — 1 min fast, 2 min easy", daysAgo: 6, hoursAgo: 7 },
    // 7 days ago (rest)
    // 8 days ago
    { goalId: muscleGoal.id, exerciseName: "Core Circuit (Rehab)", sets: 3, reps: 12, duration: 25, calories: 90, notes: "Pelvic tilts, bridges, dead bugs", daysAgo: 8, hoursAgo: 9 },
    { goalId: cardioGoal.id, exerciseName: "Swimming", duration: 35, calories: 270, notes: "Back-friendly aerobic session", daysAgo: 8, hoursAgo: 17 },
    // 9 days ago
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 40, calories: 200, notes: "Nature trail — 3.2 km", daysAgo: 9, hoursAgo: 7 },
    // 10 days ago
    { goalId: muscleGoal.id, exerciseName: "Dead Bug", sets: 3, reps: 10, duration: 15, calories: 55, daysAgo: 10, hoursAgo: 8 },
    { goalId: cardioGoal.id, exerciseName: "Yoga (Hatha)", duration: 50, calories: 130, notes: "IBS-soothing poses: child's pose, supine twist", daysAgo: 10, hoursAgo: 18 },
    // 11 days ago
    { goalId: cardioGoal.id, exerciseName: "Cycling (Stationary)", duration: 30, calories: 200, daysAgo: 11, hoursAgo: 7 },
    // 12 days ago
    { goalId: muscleGoal.id, exerciseName: "Plank + Side Plank Circuit", sets: 3, reps: 1, duration: 20, calories: 80, daysAgo: 12, hoursAgo: 9 },
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 30, calories: 150, daysAgo: 12, hoursAgo: 20 },
    // 13 days ago
    { goalId: cardioGoal.id, exerciseName: "Swimming", duration: 40, calories: 290, notes: "Best session yet — no back pain", daysAgo: 13, hoursAgo: 10 },
    // 14 days ago
    { goalId: muscleGoal.id, exerciseName: "Bird-Dog + Bridge", sets: 3, reps: 12, duration: 20, calories: 70, daysAgo: 14, hoursAgo: 8 },
    { goalId: cardioGoal.id, exerciseName: "Brisk Walking", duration: 30, calories: 155, daysAgo: 14, hoursAgo: 19 },
  ];

  for (const w of workoutData) {
    await db.workoutLog.create({
      data: {
        userId: user.id,
        goalId: w.goalId,
        exerciseName: w.exerciseName,
        sets: w.sets ?? null,
        reps: w.reps ?? null,
        weight: w.weight ?? null,
        duration: w.duration ?? null,
        calories: w.calories ?? null,
        notes: w.notes ?? null,
        loggedAt: subHours(subDays(new Date(), w.daysAgo), w.hoursAgo),
      },
    });
  }

  console.log(`✅ Created ${workoutData.length} workout logs`);

  // Progress entries for weight loss goal (weekly weigh-ins over 45 days)
  const weightEntries = [
    { value: 81.8, daysAgo: 45 },
    { value: 81.5, daysAgo: 38 },
    { value: 81.1, daysAgo: 31 },
    { value: 80.8, daysAgo: 24 },
    { value: 80.5, daysAgo: 17 },
    { value: 80.2, daysAgo: 10 },
    { value: 80.2, daysAgo: 3 },
  ];

  for (const e of weightEntries) {
    await db.progressEntry.create({
      data: {
        userId: user.id,
        goalId: weightGoal.id,
        value: e.value,
        notes: e.daysAgo === 45 ? "Starting weight" : e.value <= 80.2 ? "On track — IBS-friendly diet working well" : null,
        recordedAt: subDays(new Date(), e.daysAgo),
      },
    });
  }

  // Progress entries for protein goal (weekly averages)
  const proteinEntries = [
    { value: 95, daysAgo: 30, notes: "Hard without eggs — mainly tofu + paneer" },
    { value: 104, daysAgo: 23, notes: "Added whey isolate scoop" },
    { value: 108, daysAgo: 16, notes: "Pumpkin seeds + walnuts helping" },
    { value: 112, daysAgo: 9, notes: "Consistent with daily plan" },
    { value: 112, daysAgo: 2, notes: "Holding steady, target is 130g" },
  ];

  for (const e of proteinEntries) {
    await db.progressEntry.create({
      data: {
        userId: user.id,
        goalId: calorieGoal.id,
        value: e.value,
        notes: e.notes,
        recordedAt: subDays(new Date(), e.daysAgo),
      },
    });
  }

  // Progress entries for cardio sessions
  const cardioEntries = [
    { value: 20, daysAgo: 45 },
    { value: 40, daysAgo: 35 },
    { value: 60, daysAgo: 25 },
    { value: 80, daysAgo: 15 },
    { value: 96, daysAgo: 7 },
    { value: 104, daysAgo: 1 },
  ];

  for (const e of cardioEntries) {
    await db.progressEntry.create({
      data: {
        userId: user.id,
        goalId: cardioGoal.id,
        value: e.value,
        recordedAt: subDays(new Date(), e.daysAgo),
      },
    });
  }

  console.log("✅ Created progress entries");
  console.log("\n🎉 Seed complete!");
  console.log("----------------------------");
  console.log("Demo login credentials:");
  console.log("  Email:    demo@fittrack.app");
  console.log("  Password: password123");
  console.log("----------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
