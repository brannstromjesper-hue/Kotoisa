-- Supabase setup for Kotoisa.
--
-- Run this in the Supabase SQL editor, then enable Realtime for the
-- `documents` table from Database > Replication.

create table if not exists public.documents (
  path text primary key,
  collection_path text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_collection_path_idx
  on public.documents (collection_path);

create index if not exists documents_data_gin_idx
  on public.documents using gin (data);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'documents_set_updated_at'
      and tgrelid = 'public.documents'::regclass
  ) then
    create trigger documents_set_updated_at
    before update on public.documents
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.documents enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documents'
      and policyname = 'documents_authenticated_all'
  ) then
    create policy "documents_authenticated_all"
    on public.documents
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end;
$$;

-- Store profile and recipe images in one public bucket. The app saves the
-- public URL in the corresponding document.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-images',
  'app-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'app_images_public_read'
  ) then
    create policy "app_images_public_read"
    on storage.objects
    for select
    to public
    using (bucket_id = 'app-images');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'app_images_authenticated_all'
  ) then
    create policy "app_images_authenticated_all"
    on storage.objects
    for all
    to authenticated
    using (
      bucket_id = 'app-images'
      and (storage.foldername(name))[1] in ('avatars', 'families')
    )
    with check (
      bucket_id = 'app-images'
      and (storage.foldername(name))[1] in ('avatars', 'families')
    );
  end if;
end;
$$;
