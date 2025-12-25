-- ==========================================
-- 1. Video Models Configuration
-- ==========================================

-- Drop existing policy to avoid conflicts
drop policy if exists "Allow public read access" on public.video_models;

-- Create table
create table if not exists public.video_models (
  id text primary key,
  name text not null,
  credits integer not null default 10,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.video_models enable row level security;

-- Create policy
create policy "Allow public read access" on public.video_models for select using (true);

-- Insert data (Upsert)
insert into public.video_models (id, name, credits)
values 
  ('sora-2', 'Sora 2', 6),
  ('sora-2-pro', 'Sora 2 Pro', 100),
  ('veo_3_1', 'Google Veo 3.1', 10),
  ('veo_3_1-fast', 'Google Veo 3 Fast', 10),
  ('veo3.1-pro', 'Google Veo 3.1 Pro', 100)
on conflict (id) do update 
set name = excluded.name, credits = excluded.credits;


-- ==========================================
-- 2. Video Generations (Task Persistence)
-- ==========================================

create table if not exists public.video_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  task_id text, -- Cloud provider task ID
  prompt text not null,
  model text not null,
  aspect_ratio text,
  duration text,
  status text default 'pending', -- pending, processing, completed, failed
  video_url text,
  error_reason text,
  meta jsonb, -- Store extra info like images, resolution
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.video_generations enable row level security;

-- Policies
create policy "Users can view own generations" 
  on public.video_generations for select 
  using (auth.uid() = user_id);

create policy "Users can insert own generations" 
  on public.video_generations for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own generations" 
  on public.video_generations for update 
  using (auth.uid() = user_id);


-- ==========================================
-- 3. App Config (Secrets)
-- ==========================================

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.app_config enable row level security;

-- NO public access policies! Only service role (backend) can read.
-- But we need to allow authenticated users to read NON-SECRET configs if needed.
-- For now, we assume this table stores SECRETS like API Keys, so NO access for anon/authenticated.

-- Insert initial keys (Placeholders - User needs to update these in Dashboard)
insert into public.app_config (key, value, description)
values 
  ('YUNWU_API_KEY', 'sk-placeholder', 'API Key for Video Generation Service')
on conflict (key) do nothing;
