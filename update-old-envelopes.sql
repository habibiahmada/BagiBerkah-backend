-- Script untuk update amplop lama yang tidak memiliki data playable
-- Jalankan script ini di database untuk set default playable type

-- Update semua recipient yang belum punya playableType
UPDATE "Recipient"
SET 
  "playableType" = 'DIRECT'
WHERE "playableType" IS NULL;

-- Atau jika ingin set random game untuk testing:
-- UPDATE "Recipient"
-- SET 
--   "playableType" = 'GAME',
--   "gameType" = (ARRAY['MEMORY_CARD', 'SCRATCH_CARD', 'SPIN_WHEEL', 'BALLOON_POP', 'TREASURE_HUNT'])[floor(random() * 5 + 1)]
-- WHERE "playableType" IS NULL OR "playableType" = 'DIRECT';

-- Atau set quiz untuk beberapa recipient:
-- UPDATE "Recipient"
-- SET 
--   "playableType" = 'QUIZ',
--   "quizTopic" = 'pengetahuan-umum-mudah',
--   "quizDifficulty" = 'EASY'
-- WHERE "ageLevel" = 'CHILD' AND ("playableType" IS NULL OR "playableType" = 'DIRECT');
