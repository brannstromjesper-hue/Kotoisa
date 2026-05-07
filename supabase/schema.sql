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

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "documents_select_authenticated" on public.documents;
create policy "documents_select_authenticated"
on public.documents
for select
to authenticated
using (true);

drop policy if exists "documents_insert_authenticated" on public.documents;
create policy "documents_insert_authenticated"
on public.documents
for insert
to authenticated
with check (true);

drop policy if exists "documents_update_authenticated" on public.documents;
create policy "documents_update_authenticated"
on public.documents
for update
to authenticated
using (true)
with check (true);

drop policy if exists "documents_delete_authenticated" on public.documents;
create policy "documents_delete_authenticated"
on public.documents
for delete
to authenticated
using (true);

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

drop policy if exists "app_images_public_read" on storage.objects;
create policy "app_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'app-images');

drop policy if exists "app_images_authenticated_insert" on storage.objects;
create policy "app_images_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] in ('avatars', 'families')
);

drop policy if exists "app_images_authenticated_update" on storage.objects;
create policy "app_images_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] in ('avatars', 'families')
)
with check (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] in ('avatars', 'families')
);

drop policy if exists "app_images_authenticated_delete" on storage.objects;
create policy "app_images_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] in ('avatars', 'families')
);
