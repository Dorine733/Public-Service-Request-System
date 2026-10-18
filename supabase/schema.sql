-- Run this whole file in Supabase > SQL Editor

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role text not null default 'citizen' check (role in ('citizen','admin')),
  created_at timestamptz default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  location text not null,
  description text not null,
  image_url text,
  status text not null default 'Pending' check (status in ('Pending','In Progress','Resolved')),
  admin_note text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- (re-run safe) columns added for the map picker
alter table requests add column if not exists latitude double precision;
alter table requests add column if not exists longitude double precision;

-- In-app notifications for citizens
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  request_id uuid references requests(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

-- Auto-create a profile when a user signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles enable row level security;
alter table requests enable row level security;
alter table notifications enable row level security;

drop policy if exists "own profile or admin read" on profiles;
create policy "own profile or admin read" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "citizen reads own requests" on requests;
create policy "citizen reads own requests" on requests for select using (user_id = auth.uid() or is_admin());
drop policy if exists "citizen creates own requests" on requests;
create policy "citizen creates own requests" on requests for insert with check (user_id = auth.uid());
drop policy if exists "admin updates requests" on requests;
create policy "admin updates requests" on requests for update using (is_admin());
drop policy if exists "admin deletes requests" on requests;
create policy "admin deletes requests" on requests for delete using (is_admin());

drop policy if exists "own notifications read" on notifications;
drop policy if exists "own notifications update" on notifications;
create policy "own notifications read" on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update using (user_id = auth.uid());

-- Notify the citizen whenever status or admin note changes
create or replace function notify_request_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, request_id, message)
    values (new.user_id, new.id, 'Your ' || new.category || ' request is now ' || new.status || '.');
  elsif new.admin_note is distinct from old.admin_note then
    insert into notifications (user_id, request_id, message)
    values (new.user_id, new.id, 'New note on your ' || new.category || ' request.');
  end if;
  return new;
end $$;
drop trigger if exists on_request_change on requests;
create trigger on_request_change after update on requests
  for each row execute function notify_request_change();

-- Image storage
insert into storage.buckets (id, name, public) values ('request-images','request-images', true)
on conflict (id) do nothing;
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects for select using (bucket_id = 'request-images');
drop policy if exists "users upload own images" on storage.objects;
create policy "users upload own images" on storage.objects for insert to authenticated
  with check (bucket_id = 'request-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Make yourself admin AFTER registering in the app:
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
