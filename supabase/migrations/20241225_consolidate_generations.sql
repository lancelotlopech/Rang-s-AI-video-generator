-- ==========================================
-- Migration: Consolidate Generations Table
-- ==========================================

-- 1. Create 'generations' table if it doesn't exist (Base Schema)
-- Note: User screenshot shows it exists, but we ensure it here.
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'video' or 'image'
  model text,
  status text default 'pending',
  cost integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add missing columns (Idempotent: uses 'if not exists')
-- Common columns
alter table public.generations add column if not exists prompt text;
alter table public.generations add column if not exists url text; -- For image URL or general result
alter table public.generations add column if not exists meta jsonb default '{}'::jsonb;
alter table public.generations add column if not exists error_reason text;
alter table public.generations add column if not exists task_id text; -- External API Task ID

-- Video specific columns (can be nullable)
alter table public.generations add column if not exists video_url text; -- Specific for video result
alter table public.generations add column if not exists duration text;
alter table public.generations add column if not exists aspect_ratio text;

-- 3. Cleanup Old Tables
drop table if exists public.video_generations;
drop table if exists public.image_generations;

-- 4. Security Policies (RLS)
alter table public.generations enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view own generations" on public.generations;
drop policy if exists "Users can insert own generations" on public.generations;
drop policy if exists "Users can update own generations" on public.generations;

-- Create Policies
create policy "Users can view own generations" 
  on public.generations for select 
  using (auth.uid() = user_id);

create policy "Users can insert own generations" 
  on public.generations for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own generations" 
  on public.generations for update 
  using (auth.uid() = user_id);

-- 5. Helper Function for Credit Deduction (Safety)
-- This ensures atomic updates to profile credits
create or replace function public.decrement_credits(amount int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set credits = credits - amount
  where id = auth.uid()
  and credits >= amount;
  
  if not found then
    raise exception 'Insufficient credits';
  end if;
end;
$$;

create or replace function public.increment_credits(amount int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set credits = credits + amount
  where id = auth.uid();
end;
$$;
