create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  subject text not null default 'General',
  description text,
  cover_image_url text not null default '',
  storage_path text not null default '',
  file_name text not null default '',
  file_mime_type text not null default 'application/pdf',
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.books
  add column if not exists subject text not null default 'General';

alter table public.books
  add column if not exists description text;

alter table public.books
  add column if not exists cover_image_url text not null default '';

alter table public.books
  add column if not exists storage_path text not null default '';

alter table public.books
  add column if not exists file_name text not null default '';

alter table public.books
  add column if not exists file_mime_type text not null default 'application/pdf';

alter table public.books
  add column if not exists file_size bigint not null default 0;

alter table public.books
  add column if not exists created_at timestamptz not null default now();

alter table public.books enable row level security;
