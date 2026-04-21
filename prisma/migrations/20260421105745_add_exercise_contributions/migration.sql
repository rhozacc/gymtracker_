-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuscleContribution" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MuscleContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MuscleContribution_exerciseId_idx" ON "MuscleContribution"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "MuscleContribution_exerciseId_muscleGroup_key" ON "MuscleContribution"("exerciseId", "muscleGroup");

-- AddForeignKey
ALTER TABLE "MuscleContribution" ADD CONSTRAINT "MuscleContribution_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed canonical exercises
INSERT INTO "Exercise" ("id", "name", "createdAt", "updatedAt") VALUES
  ('bench_press',           'Bench Press',           NOW(), NOW()),
  ('incline_db_press',      'Incline DB Press',      NOW(), NOW()),
  ('cable_fly',             'Cable Fly',             NOW(), NOW()),
  ('fly_machine',           'Fly Machine',           NOW(), NOW()),
  ('pec_deck',              'Pec Deck',              NOW(), NOW()),
  ('dips',                  'Dips',                  NOW(), NOW()),
  ('weighted_dips',         'Weighted Dips',         NOW(), NOW()),
  ('close_grip_bench',      'Close-Grip Bench',      NOW(), NOW()),
  ('barbell_row',           'Barbell Row',           NOW(), NOW()),
  ('pulldown',              'Lat Pulldown',          NOW(), NOW()),
  ('weighted_pullup',       'Weighted Pull-up',      NOW(), NOW()),
  ('cable_row',             'Cable Row',             NOW(), NOW()),
  ('straight_arm_pulldown', 'Straight-Arm Pulldown', NOW(), NOW()),
  ('deadlift',              'Deadlift',              NOW(), NOW()),
  ('face_pull',             'Face Pull',             NOW(), NOW()),
  ('ohp',                   'Overhead Press',        NOW(), NOW()),
  ('seated_db_press',       'Seated DB Press',       NOW(), NOW()),
  ('lateral_raise',         'Lateral Raise',         NOW(), NOW()),
  ('cable_lateral_raise',   'Cable Lateral Raise',   NOW(), NOW()),
  ('rear_delt_fly',         'Rear Delt Fly',         NOW(), NOW()),
  ('shrugs',                'Shrugs',                NOW(), NOW()),
  ('squat',                 'Squat',                 NOW(), NOW()),
  ('rdl',                   'Romanian Deadlift',     NOW(), NOW()),
  ('bulgarian_split_squat', 'Bulgarian Split Squat', NOW(), NOW()),
  ('leg_press',             'Leg Press',             NOW(), NOW()),
  ('walking_lunge',         'Walking Lunge',         NOW(), NOW()),
  ('leg_curl',              'Leg Curl',              NOW(), NOW()),
  ('lying_curl',            'Lying Leg Curl',        NOW(), NOW()),
  ('leg_extension',         'Leg Extension',         NOW(), NOW()),
  ('calf_raise',            'Calf Raise',            NOW(), NOW()),
  ('calf_raise_hyp',        'Seated Calf Raise',     NOW(), NOW()),
  ('hip_thrust',            'Hip Thrust',            NOW(), NOW()),
  ('biceps_curl',           'Biceps Curl',           NOW(), NOW()),
  ('barbell_curl',          'Barbell Curl',          NOW(), NOW()),
  ('hammer_curl',           'Hammer Curl',           NOW(), NOW()),
  ('preacher_curl',         'Preacher Curl',         NOW(), NOW()),
  ('triceps',               'Triceps Pushdown',      NOW(), NOW()),
  ('triceps_pushdown',      'Triceps Pushdown',      NOW(), NOW()),
  ('overhead_extension',    'Overhead Extension',    NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed weighted muscle contributions (EMG + RP Hypertrophy framework)
INSERT INTO "MuscleContribution" ("id", "exerciseId", "muscleGroup", "weight") VALUES
  (gen_random_uuid()::text, 'bench_press', 'Chest', 0.60),
  (gen_random_uuid()::text, 'bench_press', 'Arms', 0.25),
  (gen_random_uuid()::text, 'bench_press', 'Shoulders', 0.15),
  (gen_random_uuid()::text, 'incline_db_press', 'Chest', 0.55),
  (gen_random_uuid()::text, 'incline_db_press', 'Shoulders', 0.25),
  (gen_random_uuid()::text, 'incline_db_press', 'Arms', 0.20),
  (gen_random_uuid()::text, 'cable_fly', 'Chest', 0.90),
  (gen_random_uuid()::text, 'cable_fly', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'fly_machine', 'Chest', 0.90),
  (gen_random_uuid()::text, 'fly_machine', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'pec_deck', 'Chest', 0.95),
  (gen_random_uuid()::text, 'pec_deck', 'Shoulders', 0.05),
  (gen_random_uuid()::text, 'dips', 'Chest', 0.50),
  (gen_random_uuid()::text, 'dips', 'Arms', 0.35),
  (gen_random_uuid()::text, 'dips', 'Shoulders', 0.15),
  (gen_random_uuid()::text, 'weighted_dips', 'Chest', 0.50),
  (gen_random_uuid()::text, 'weighted_dips', 'Arms', 0.35),
  (gen_random_uuid()::text, 'weighted_dips', 'Shoulders', 0.15),
  (gen_random_uuid()::text, 'close_grip_bench', 'Arms', 0.55),
  (gen_random_uuid()::text, 'close_grip_bench', 'Chest', 0.30),
  (gen_random_uuid()::text, 'close_grip_bench', 'Shoulders', 0.15),
  (gen_random_uuid()::text, 'barbell_row', 'Back', 0.60),
  (gen_random_uuid()::text, 'barbell_row', 'Arms', 0.25),
  (gen_random_uuid()::text, 'barbell_row', 'Shoulders', 0.15),
  (gen_random_uuid()::text, 'pulldown', 'Back', 0.60),
  (gen_random_uuid()::text, 'pulldown', 'Arms', 0.30),
  (gen_random_uuid()::text, 'pulldown', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'weighted_pullup', 'Back', 0.60),
  (gen_random_uuid()::text, 'weighted_pullup', 'Arms', 0.30),
  (gen_random_uuid()::text, 'weighted_pullup', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'cable_row', 'Back', 0.65),
  (gen_random_uuid()::text, 'cable_row', 'Arms', 0.25),
  (gen_random_uuid()::text, 'cable_row', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'straight_arm_pulldown', 'Back', 0.85),
  (gen_random_uuid()::text, 'straight_arm_pulldown', 'Arms', 0.10),
  (gen_random_uuid()::text, 'straight_arm_pulldown', 'Shoulders', 0.05),
  (gen_random_uuid()::text, 'deadlift', 'Back', 0.45),
  (gen_random_uuid()::text, 'deadlift', 'Legs', 0.45),
  (gen_random_uuid()::text, 'deadlift', 'Shoulders', 0.10),
  (gen_random_uuid()::text, 'face_pull', 'Shoulders', 0.55),
  (gen_random_uuid()::text, 'face_pull', 'Back', 0.30),
  (gen_random_uuid()::text, 'face_pull', 'Arms', 0.15),
  (gen_random_uuid()::text, 'ohp', 'Shoulders', 0.55),
  (gen_random_uuid()::text, 'ohp', 'Arms', 0.30),
  (gen_random_uuid()::text, 'ohp', 'Chest', 0.15),
  (gen_random_uuid()::text, 'seated_db_press', 'Shoulders', 0.55),
  (gen_random_uuid()::text, 'seated_db_press', 'Arms', 0.30),
  (gen_random_uuid()::text, 'seated_db_press', 'Chest', 0.15),
  (gen_random_uuid()::text, 'lateral_raise', 'Shoulders', 0.95),
  (gen_random_uuid()::text, 'lateral_raise', 'Back', 0.05),
  (gen_random_uuid()::text, 'cable_lateral_raise', 'Shoulders', 0.95),
  (gen_random_uuid()::text, 'cable_lateral_raise', 'Back', 0.05),
  (gen_random_uuid()::text, 'rear_delt_fly', 'Shoulders', 0.55),
  (gen_random_uuid()::text, 'rear_delt_fly', 'Back', 0.45),
  (gen_random_uuid()::text, 'shrugs', 'Back', 0.55),
  (gen_random_uuid()::text, 'shrugs', 'Shoulders', 0.45),
  (gen_random_uuid()::text, 'squat', 'Legs', 0.85),
  (gen_random_uuid()::text, 'squat', 'Back', 0.10),
  (gen_random_uuid()::text, 'squat', 'Shoulders', 0.05),
  (gen_random_uuid()::text, 'rdl', 'Legs', 0.70),
  (gen_random_uuid()::text, 'rdl', 'Back', 0.30),
  (gen_random_uuid()::text, 'bulgarian_split_squat', 'Legs', 0.90),
  (gen_random_uuid()::text, 'bulgarian_split_squat', 'Back', 0.10),
  (gen_random_uuid()::text, 'leg_press', 'Legs', 1.00),
  (gen_random_uuid()::text, 'walking_lunge', 'Legs', 0.90),
  (gen_random_uuid()::text, 'walking_lunge', 'Back', 0.10),
  (gen_random_uuid()::text, 'leg_curl', 'Legs', 1.00),
  (gen_random_uuid()::text, 'lying_curl', 'Legs', 1.00),
  (gen_random_uuid()::text, 'leg_extension', 'Legs', 1.00),
  (gen_random_uuid()::text, 'calf_raise', 'Legs', 1.00),
  (gen_random_uuid()::text, 'calf_raise_hyp', 'Legs', 1.00),
  (gen_random_uuid()::text, 'hip_thrust', 'Legs', 1.00),
  (gen_random_uuid()::text, 'biceps_curl', 'Arms', 1.00),
  (gen_random_uuid()::text, 'barbell_curl', 'Arms', 1.00),
  (gen_random_uuid()::text, 'hammer_curl', 'Arms', 1.00),
  (gen_random_uuid()::text, 'preacher_curl', 'Arms', 1.00),
  (gen_random_uuid()::text, 'triceps', 'Arms', 1.00),
  (gen_random_uuid()::text, 'triceps_pushdown', 'Arms', 1.00),
  (gen_random_uuid()::text, 'overhead_extension', 'Arms', 1.00)
ON CONFLICT ("exerciseId", "muscleGroup") DO NOTHING;
