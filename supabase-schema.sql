-- ============================================================
-- Danya Memorial Board v4 — Supabase SQL Schema
-- Adds image_url + image_public_id columns for Cloudinary
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Admin users table ────────────────────────────────────────

create table if not exists admin_users (
  id            uuid    primary key default uuid_generate_v4(),
  name          text    not null check (char_length(name) between 1 and 80),
  email         text    not null unique check (email = lower(email)),
  password_hash text    not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table admin_users enable row level security;

create policy "block_public_admin_users"
  on admin_users for all using (false);

-- ── Messages table ───────────────────────────────────────────

create table if not exists messages (
  id                   uuid        primary key default uuid_generate_v4(),
  name                 text        not null check (char_length(name) between 1 and 80),
  content              text        not null check (char_length(content) between 10 and 1000),
  status               text        not null default 'pending'
                                   check (status in ('pending', 'approved', 'rejected')),
  moderation_token     text        not null,
  created_at           timestamptz not null default now(),
  approved_at          timestamptz,
  approved_by_admin_id uuid        references admin_users(id) on delete set null,
  -- Image hosting via Cloudinary (both nullable — image is optional)
  image_url            text,        -- public HTTPS URL shown on the board
  image_public_id      text         -- Cloudinary public_id used for deletion
);

-- ── Upgrading from v3? Run these ALTER statements instead: ───
-- alter table messages add column if not exists image_url text;
-- alter table messages add column if not exists image_public_id text;

-- Indexes
create index if not exists messages_approved_idx
  on messages (created_at desc) where status = 'approved';

create index if not exists messages_status_created_idx
  on messages (status, created_at desc);

create index if not exists messages_approver_idx
  on messages (approved_by_admin_id) where approved_by_admin_id is not null;

-- ── Row Level Security ───────────────────────────────────────

alter table messages enable row level security;

-- Public: read approved messages (image_public_id NOT returned — select specific columns in client)
create policy "public_select_approved"
  on messages for select using (status = 'approved');

-- Public: insert pending messages only
create policy "public_insert_pending"
  on messages for insert
  with check (
    status = 'pending'
    and char_length(name) between 1 and 80
    and char_length(content) between 10 and 1000
    and char_length(moderation_token) = 64
    and approved_by_admin_id is null
    and approved_at is null
  );

-- Block all public updates and deletes
create policy "block_public_update" on messages for update using (false);
create policy "block_public_delete" on messages for delete using (false);

-- ── Notes ────────────────────────────────────────────────────
-- Service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS.
-- All admin operations use the supabase-admin.ts client.
-- image_public_id is only fetched server-side for Cloudinary deletion.
