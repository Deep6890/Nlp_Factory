-- ============================================================
-- Armor.ai — Supabase Schema (Supabase Storage, no Cloudinary)
-- Run in Supabase SQL Editor
-- ============================================================

-- Users profile table
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recordings table (storage_path = path inside Supabase bucket)
create table if not exists public.recordings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  filename     text default 'audio',
  storage_path text not null,          -- e.g. userId/timestamp-random.webm
  storage_url  text not null,          -- public URL from Supabase Storage
  mime_type    text,
  size         bigint,
  duration     numeric,
  recorded_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Transcripts table — one per recording, stores full AI JSON
create table if not exists public.transcripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  recording_id  uuid not null unique references public.recordings(id) on delete cascade,
  text          text default '',
  language      text default 'en',
  confidence    numeric,
  keywords      jsonb default '[]',
  summary       text default '',
  insights      jsonb,
  status        text not null default 'pending' check (status in ('pending','processing','done','failed')),
  error_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes
create index if not exists idx_recordings_user_id    on public.recordings(user_id);
create index if not exists idx_transcripts_user_id   on public.transcripts(user_id);
create index if not exists idx_transcripts_recording on public.transcripts(recording_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger trg_users_updated_at
  before update on public.users for each row execute function public.set_updated_at();
create or replace trigger trg_recordings_updated_at
  before update on public.recordings for each row execute function public.set_updated_at();
create or replace trigger trg_transcripts_updated_at
  before update on public.transcripts for each row execute function public.set_updated_at();

-- RLS
alter table public.users       enable row level security;
alter table public.recordings  enable row level security;
alter table public.transcripts enable row level security;

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run this too:
-- insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true)
-- on conflict (id) do nothing;
