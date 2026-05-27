-- Chat panel background scene (Ocean_1 … Ocean_8). New profiles default to Ocean 1.
alter table public.profiles
  add column if not exists chat_background text not null default 'Ocean_1';

comment on column public.profiles.chat_background is
  'Chat panel scene id, e.g. Ocean_1. Maps to /public/Chat Background/{id}/';
