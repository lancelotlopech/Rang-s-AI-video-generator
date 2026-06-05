-- Add Yunwu Kling model using the provider-required full model id.
insert into public.video_models (id, name, credits, description, is_active)
values (
  'kling-advanced-custom-elements:stable',
  'Kling Advanced',
  10,
  'Yunwu Kling advanced custom elements model',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  credits = excluded.credits,
  description = excluded.description,
  is_active = excluded.is_active;

-- Avoid routing the shorthand id to a provider model with no available channel.
update public.video_models
set is_active = false
where id = 'kling';
