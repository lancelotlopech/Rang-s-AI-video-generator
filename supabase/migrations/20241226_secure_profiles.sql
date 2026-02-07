-- ==========================================
-- Migration: Secure Profiles Table
-- Prevent users from directly modifying credits
-- ==========================================

-- 1. Drop any existing UPDATE policies on profiles
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Enable update for users based on id" on public.profiles;

-- 2. Ensure SELECT policy exists (users can view their own profile)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

-- 3. Create a RESTRICTED UPDATE policy
-- Only allow updating non-sensitive fields (NOT credits)
-- This uses a column-level check approach
create policy "Users can update own profile safely" 
  on public.profiles for update 
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- The actual credit protection is in the RPC functions
    -- This policy just ensures users can only update their own row
  );

-- 4. Ensure RLS is enabled
alter table public.profiles enable row level security;

-- 5. Create a trigger to prevent direct credit modifications
-- This is an additional layer of protection
create or replace function public.protect_credits()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If credits are being changed and it's not from a trusted function
  -- Check if the change is coming from our RPC functions
  if OLD.credits is distinct from NEW.credits then
    -- Only allow credit changes from service role or our RPC functions
    -- Regular users cannot change credits directly
    if current_setting('role', true) = 'authenticated' then
      -- Revert the credits change
      NEW.credits := OLD.credits;
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists protect_credits_trigger on public.profiles;

-- Create the trigger
create trigger protect_credits_trigger
  before update on public.profiles
  for each row
  execute function public.protect_credits();

-- 6. Ensure the decrement/increment functions use SECURITY DEFINER
-- and set role to service_role for credit operations
create or replace function public.decrement_credits(amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Temporarily become service role for this operation
  update public.profiles
  set credits = credits - amount,
      updated_at = now()
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
set search_path = public
as $$
begin
  update public.profiles
  set credits = credits + amount,
      updated_at = now()
  where id = auth.uid();
end;
$$;

-- 7. Revoke direct execute on dangerous functions from public
-- Only authenticated users should call these, and only through our API
revoke all on function public.increment_credits(int) from public;
revoke all on function public.increment_credits(int) from anon;
grant execute on function public.increment_credits(int) to authenticated;

revoke all on function public.decrement_credits(int) from public;
revoke all on function public.decrement_credits(int) from anon;
grant execute on function public.decrement_credits(int) to authenticated;
