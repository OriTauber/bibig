-- Imports the 18 workouts in workouts_filtered_summer_2026-2.md for one bibig user.
-- Safe to re-run: it replaces only workouts previously imported by this script.
-- Run this against the Supabase Session pooler database, after the catalog code is deployed.

BEGIN;

DO $import$
DECLARE
  target_user CONSTANT uuid := '0fce836f-0ba3-49da-b5df-c31e3d7c922f';
  source_workouts CONSTANT jsonb := $json$
[
  {"performedAt":"2026-07-18T12:00:00+03:00","kind":"pull","title":"Pull — 18 Jul 2026","notes":"Felt weak during dumbbell curls.","exercises":[{"id":"weighted-pull-up","sets":[[15,8],[15,8],[15,5]]},{"id":"machine-row","sets":[[21,12],[25,12],[25,12]]},{"id":"leg-press","sets":[[42.5,12],[50,15],[57,15]]},{"id":"dumbbell-curl","sets":[[10,8],[10,8]]},{"id":"abdominal-machine","sets":[[50,13],[50,13],[50,13]]}]},
  {"performedAt":"2026-07-18T21:00:00+03:00","kind":"push","title":"Push — 18 Jul 2026","notes":"Source labelled this session Saturday Night. Dumbbell shoulder-press loads are per hand.","exercises":[{"id":"barbell-bench-press","sets":[[60,8],[60,8],[60,8]]},{"id":"pec-deck","sets":[[42.5,15],[50,9]]},{"id":"dumbbell-shoulder-press","sets":[[18,8],[18,8],[18,8]]}]},
  {"performedAt":"2026-07-20T12:00:00+03:00","kind":"legs","title":"Legs — 20 Jul 2026","notes":"Romanian deadlift was felt more on one side. Leg curls were performed but load/repetitions were not recorded; plank: 1:30 × 3. Next workout: adjust the leg machines and Romanian deadlift.","exercises":[{"id":"barbell-squat","sets":[[50,12],[50,12],[50,12]]},{"id":"romanian-deadlift","sets":[[50,12],[50,12]]},{"id":"hip-abductor-machine","sets":[[45,12],[45,12]]}]},
  {"performedAt":"2026-07-25T21:00:00+03:00","kind":"pull","title":"Pull — 25 Jul 2026","notes":"Warm up for the seated leg press next week. Overall improvement noted. Forearm exercise: 4 kg × AMRAP (repetitions not recorded).","exercises":[{"id":"weighted-pull-up","sets":[[17.5,8],[17.5,8],[17.5,8]]},{"id":"machine-row","sets":[[20,12],[25,12],[25,2]]},{"id":"leg-press","sets":[[50,14],[57.5,15],[57.5,15]]},{"id":"dumbbell-curl","sets":[[10,12],[10,11]]},{"id":"hanging-leg-raise","sets":[[0,15],[0,15],[0,15]]}]},
  {"performedAt":"2026-07-27T21:00:00+03:00","kind":"push","title":"Push — 27 Jul 2026","notes":"Dumbbell shoulder-press loads are per hand. Cable wrist-curl + reverse-wrist-curl superset was recorded as 6.25 kg × approximately 12 wrist curls + 25 reverse wrist curls × 3; it is retained here because load/set mapping is ambiguous. Add rear-delt flyes next time or on leg day.","exercises":[{"id":"barbell-bench-press","sets":[[62.5,6],[62.5,8],[62.5,8]]},{"id":"pec-deck","sets":[[50,10]]},{"id":"dumbbell-shoulder-press","sets":[[20,6],[20,6]]},{"id":"triceps-pushdown","sets":[[13.75,10],[11.25,13],[11.25,13]]},{"id":"dumbbell-lateral-raise","sets":[[8,13],[8,13]]}]},
  {"performedAt":"2026-08-04T12:00:00+03:00","kind":"pull","title":"Pull — 4 Aug 2026","notes":"First session after a break. Warmed up this week. Overall improvement noted. Dumbbell/farmer-walk loads are per hand. Farmer's Walk: 20 kg × 35–40 seconds × 3 (timed sets retained in notes).","exercises":[{"id":"weighted-pull-up","sets":[[20,8],[20,8],[20,8]]},{"id":"machine-row","sets":[[25,12],[27.5,12],[27.5,12]]},{"id":"leg-press","sets":[[57.5,15],[57.5,15],[57.5,15]]},{"id":"cable-curl","sets":[[11.25,12],[13,12]]},{"id":"hanging-leg-raise","sets":[[0,16],[0,16],[0,16]]}]},
  {"performedAt":"2026-08-05T21:00:00+03:00","kind":"push","title":"Push — 5 Aug 2026","notes":"Dumbbell shoulder-press loads are per hand.","exercises":[{"id":"barbell-bench-press","sets":[[65,6],[65,8],[65,8]]},{"id":"pec-deck","sets":[[50,12],[50,12],[50,12]]},{"id":"dumbbell-shoulder-press","sets":[[20,6],[20,6]]},{"id":"triceps-pushdown","sets":[[13.75,10],[13.75,10]]},{"id":"overhead-triceps-extension","sets":[[11.75,8],[11.75,8]]},{"id":"reverse-fly","sets":[[20,13],[20,13],[20,13]]},{"id":"abdominal-machine","sets":[[50,15],[57,12],[57,12]]}]},
  {"performedAt":"2026-08-10T12:00:00+03:00","kind":"legs","title":"Legs — 10 Aug 2026","notes":"Source labelled this session Saturday Night. Romanian deadlift was felt more on one side. Plank: 1:40 × 3 (timed sets retained in notes). Next workout: adjust the leg machines and Romanian deadlift.","exercises":[{"id":"barbell-squat","sets":[[52.5,8],[52.5,8],[52.5,8]]},{"id":"romanian-deadlift","sets":[[52.5,12],[52.5,12]]},{"id":"seated-leg-curl","sets":[[42.5,12],[42.5,12],[42.5,12]]},{"id":"hip-adductor-machine","sets":[[21,12],[21,12]]}]},
  {"performedAt":"2026-08-10T21:00:00+03:00","kind":"pull","title":"Pull — 10 Aug 2026","notes":"Source labelled this session Monday. Improvement in everything except weighted pull-ups. Deload planned for the following week. Farmer's Walk: 20 kg per hand × 50 seconds × 3 (timed sets retained in notes).","exercises":[{"id":"weighted-pull-up","sets":[[20,8],[20,8],[20,8]]},{"id":"machine-row","sets":[[27.5,12],[30,12],[30,12]]},{"id":"cable-curl","sets":[[11.25,12],[13,12],[11,11]]},{"id":"hanging-leg-raise","sets":[[0,18],[0,18]]}]},
  {"performedAt":"2026-08-13T21:00:00+03:00","kind":"push","title":"Push — 13 Aug 2026","notes":"Dumbbell shoulder-press loads are per hand. The final bench value appeared as 7.5 reps and was normalized down to 7. Start the overhead triceps extension with the flexible bar next time.","exercises":[{"id":"barbell-bench-press","sets":[[60,8],[67.5,8],[67.5,7]]},{"id":"pec-deck","sets":[[50,12],[50,13]]},{"id":"dumbbell-shoulder-press","sets":[[20,7],[20,6]]},{"id":"triceps-pushdown","sets":[[13.75,14],[16,12]]},{"id":"overhead-triceps-extension","sets":[[11.75,7],[11.75,6]]},{"id":"dumbbell-lateral-raise","sets":[[10,12],[10,12]]},{"id":"abdominal-machine","sets":[[57.5,12],[57.5,13],[57.5,13]]}]},
  {"performedAt":"2026-08-16T21:00:00+03:00","kind":"legs","title":"Legs — 16 Aug 2026","notes":"Switched to low-bar squats; recorded under Barbell Squat. Continue with low bar next workout. Bulgarian-split-squat loads are per hand. Calf raises were AMRAP: 20 kg × AMRAP; 30 kg × AMRAP, AMRAP (repetitions not recorded).","exercises":[{"id":"barbell-squat","sets":[[60,8],[60,8],[60,8]]},{"id":"romanian-deadlift","sets":[[50,12],[55,12],[55,12]]},{"id":"seated-leg-curl","sets":[[50,12],[50,12]]},{"id":"bulgarian-split-squat","sets":[[10,12],[10,12]]}]},
  {"performedAt":"2026-08-22T21:00:00+03:00","kind":"pull","title":"Pull — 22 Aug 2026","notes":"Farmer's Walk: 22.5 kg per hand × 45 seconds × 3 (timed sets retained in notes).","exercises":[{"id":"weighted-pull-up","sets":[[20,6],[20,9],[20,9]]},{"id":"machine-row","sets":[[30,12],[30,8],[30,10]]},{"id":"leg-press","sets":[[57.5,15],[65,15]]},{"id":"cable-curl","sets":[[11.25,15],[13,13],[13,13]]},{"id":"hanging-leg-raise","sets":[[0,20],[0,20]]}]},
  {"performedAt":"2026-08-26T21:00:00+03:00","kind":"push","title":"Push — 26 Aug 2026","notes":"Dumbbell shoulder-press loads are per hand.","exercises":[{"id":"barbell-bench-press","sets":[[60,8],[70,6],[70,7]]},{"id":"dumbbell-shoulder-press","sets":[[20,8],[20,5]]},{"id":"triceps-pushdown","sets":[[13.75,12],[13.75,12]]},{"id":"pec-deck","sets":[[50,15],[50,15]]},{"id":"face-pull","sets":[[8.75,14],[8.75,14]]},{"id":"dumbbell-lateral-raise","sets":[[10,13],[10,10]]},{"id":"abdominal-machine","sets":[[57.5,12],[57.5,13],[57.5,13]]}]},
  {"performedAt":"2026-08-29T21:00:00+03:00","kind":"legs","title":"Legs — 29 Aug 2026","notes":"Strong-side back pain during low-bar squats. Low-bar squats are recorded under Barbell Squat; Bulgarian-split-squat loads are per hand. The source listed Romanian-deadlift loads 50, 55, 55 with one 14-rep value; this import applies 14 reps to each load because exact mapping was unavailable. Plank: 1:40; 2:00; 1:30 (timed sets retained in notes). Next workout: correct low-bar squat technique.","exercises":[{"id":"barbell-squat","sets":[[60,8],[65,8]]},{"id":"romanian-deadlift","sets":[[50,14],[55,14],[55,14]]},{"id":"bulgarian-split-squat","sets":[[12,12],[12,12]]},{"id":"seated-leg-curl","sets":[[50,13],[55,13]]}]},
  {"performedAt":"2026-09-04T12:00:00+03:00","kind":"pull","title":"Pull — 4 Sep 2026","notes":"Farmer's Walk: 22.5 kg per hand × 45 seconds × 3 (timed sets retained in notes).","exercises":[{"id":"weighted-pull-up","sets":[[15,8],[21.25,8],[21.25,7]]},{"id":"machine-row","sets":[[25,12],[30,12],[30,12]]},{"id":"leg-press","sets":[[65,16],[72.5,15],[72.5,15]]},{"id":"cable-curl","sets":[[13,13],[13,14],[13,13]]},{"id":"face-pull","sets":[[8.75,15],[10,15],[10,15]]},{"id":"hanging-leg-raise","sets":[[0,22],[0,22]]}]},
  {"performedAt":"2026-09-05T21:00:00+03:00","kind":"push","title":"Push — 5 Sep 2026","notes":"Dumbbell shoulder-press loads are per hand. Pain was felt during chest flyes.","exercises":[{"id":"barbell-bench-press","sets":[[60,9],[70,7],[70,5]]},{"id":"dumbbell-shoulder-press","sets":[[20,6],[20,7]]},{"id":"triceps-pushdown","sets":[[13.75,13],[16,12],[16,12]]},{"id":"pec-deck","sets":[[50,15]]},{"id":"face-pull","sets":[[8.75,15],[10,15],[10,15]]},{"id":"dumbbell-lateral-raise","sets":[[10,13],[10,12]]},{"id":"abdominal-machine","sets":[[57.5,12],[65,15]]}]},
  {"performedAt":"2026-09-09T12:00:00+03:00","kind":"pull","title":"Pull — 9 Sep 2026","notes":"Trained after a long day with little food. The final hanging-leg-raise set used elbow support. Pull-ups are bodyweight, therefore stored with 0 kg.","exercises":[{"id":"pull-up","sets":[[0,20],[0,15],[0,15]]},{"id":"machine-row","sets":[[30,8],[30,9],[30,12]]},{"id":"triceps-pushdown","sets":[[13,15],[16,15],[16,12]]},{"id":"face-pull","sets":[[8.75,16],[10,15],[10,15]]},{"id":"dumbbell-curl","sets":[[12,8],[12,8]]},{"id":"hanging-leg-raise","sets":[[0,15],[0,15],[0,15]]}]},
  {"performedAt":"2026-09-22T21:00:00+03:00","kind":"push","title":"Push — 22 Sep 2026","notes":"Dumbbell shoulder-press loads are per hand. Pull-ups are bodyweight, therefore stored with 0 kg.","exercises":[{"id":"barbell-bench-press","sets":[[60,10],[60,10],[60,10]]},{"id":"pull-up","sets":[[0,15],[0,15]]},{"id":"dumbbell-shoulder-press","sets":[[20,8],[20,4]]},{"id":"triceps-pushdown","sets":[[13.75,13],[16,12],[16,12]]},{"id":"pec-deck","sets":[[50,15]]},{"id":"face-pull","sets":[[8.75,15],[10,15],[10,15]]},{"id":"dumbbell-lateral-raise","sets":[[10,13],[10,12]]},{"id":"abdominal-machine","sets":[[57.5,12],[65,15]]}]}
]
$json$::jsonb;
  workout jsonb;
  exercise jsonb;
  set_data jsonb;
  workout_id uuid;
  exercise_row_id uuid;
  exercise_position integer;
  set_number integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user) THEN
    RAISE EXCEPTION 'User % does not exist; aborting import.', target_user;
  END IF;

  DELETE FROM workouts
  WHERE user_id = target_user AND notes LIKE '[Imported summer-2026]%';

  FOR workout IN SELECT value FROM jsonb_array_elements(source_workouts)
  LOOP
    workout_id := gen_random_uuid();
    INSERT INTO workouts (id, user_id, type, kind, performed_at, title, notes, created_at, updated_at)
    VALUES (
      workout_id, target_user, 'strength', workout->>'kind',
      (workout->>'performedAt')::timestamptz, workout->>'title',
      '[Imported summer-2026] ' || COALESCE(workout->>'notes', ''),
      (workout->>'performedAt')::timestamptz, (workout->>'performedAt')::timestamptz
    );

    exercise_position := 0;
    FOR exercise IN SELECT value FROM jsonb_array_elements(workout->'exercises')
    LOOP
      exercise_row_id := gen_random_uuid();
      INSERT INTO strength_exercises (id, workout_id, exercise_id, position)
      VALUES (exercise_row_id, workout_id, exercise->>'id', exercise_position);

      set_number := 0;
      FOR set_data IN SELECT value FROM jsonb_array_elements(exercise->'sets')
      LOOP
        INSERT INTO strength_sets (id, strength_exercise_id, set_number, reps, weight_kg, completed)
        VALUES (
          gen_random_uuid(), exercise_row_id, set_number,
          (set_data->>1)::integer, (set_data->>0)::numeric, true
        );
        set_number := set_number + 1;
      END LOOP;
      exercise_position := exercise_position + 1;
    END LOOP;
  END LOOP;
END;
$import$;

COMMIT;
