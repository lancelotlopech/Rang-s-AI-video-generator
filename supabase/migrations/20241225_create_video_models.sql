-- Create video_models table
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

-- Create policy to allow everyone to read active models
create policy "Allow public read access"
  on public.video_models
  for select
  using (true);

-- Insert initial data (based on what we had in env)
insert into public.video_models (id, name, credits, description)
values 
  ('sora-2', 'Sora 2.0', 15, 'OpenAI Sora 2.0 model'),
  ('veo-2', 'Google Veo 2', 10, 'Google Veo 2 model'),
  ('runway-gen3', 'Runway Gen-3', 12, 'Runway Gen-3 Alpha')
on conflict (id) do nothing;
