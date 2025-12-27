-- ==========================================
-- Add indexes for better query performance
-- ==========================================

-- video_generations indexes
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id 
  ON public.video_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_video_generations_status 
  ON public.video_generations(status);

CREATE INDEX IF NOT EXISTS idx_video_generations_created_at 
  ON public.video_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_generations_user_status 
  ON public.video_generations(user_id, status);

-- Composite index for common query pattern: user's recent generations
CREATE INDEX IF NOT EXISTS idx_video_generations_user_created 
  ON public.video_generations(user_id, created_at DESC);

-- generations table indexes (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generations') THEN
    CREATE INDEX IF NOT EXISTS idx_generations_user_id 
      ON public.generations(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_generations_type 
      ON public.generations(type);
    
    CREATE INDEX IF NOT EXISTS idx_generations_status 
      ON public.generations(status);
    
    CREATE INDEX IF NOT EXISTS idx_generations_created_at 
      ON public.generations(created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_generations_user_type 
      ON public.generations(user_id, type);
  END IF;
END $$;
