-- ============================================================
-- Danya Memorial Board v3 — Supabase SQL Schema
-- Multi-approver support + approver tracking
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Admin users table ────────────────────────────────────────
-- Stores all approvers. password_hash uses PBKDF2-SHA512.
-- The service role key is used for all admin reads/writes — RLS blocks public access.

create table if not exists admin_users (
  id            uuid    primary key default uuid_generate_v4(),
  name          text    not null check (char_length(name) between 1 and 80),
  email         text    not null unique check (email = lower(email)),
  password_hash text    not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Block all public access to admin_users
alter table admin_users enable row level security;

create policy "block_public_admin_users"
  on admin_users
  for all
  using (false);

-- ── Messages table ───────────────────────────────────────────

-- Drop old table if upgrading from v1/v2 (uncomment if needed):
-- drop table if exists messages;

create table if not exists messages (
  id                   uuid        primary key default uuid_generate_v4(),
  name                 text        not null check (char_length(name) between 1 and 80),
  content              text        not null check (char_length(content) between 10 and 1000),
  status               text        not null default 'pending'
                                   check (status in ('pending', 'approved', 'rejected')),
  moderation_token     text        not null,
  created_at           timestamptz not null default now(),
  approved_at          timestamptz,
  -- Internal only: which admin approved/rejected. Never exposed on public board.
  approved_by_admin_id uuid        references admin_users(id) on delete set null
);

-- Index for public board (approved only, newest first)
create index if not exists messages_approved_idx
  on messages (created_at desc)
  where status = 'approved';

-- Index for admin dashboard
create index if not exists messages_status_created_idx
  on messages (status, created_at desc);

-- Index for approver lookup
create index if not exists messages_approver_idx
  on messages (approved_by_admin_id)
  where approved_by_admin_id is not null;

-- ── Row Level Security for messages ─────────────────────────

alter table messages enable row level security;

-- PUBLIC: select only approved messages
-- Note: approved_by_admin_id is NOT in any select policy response
-- (the public Supabase client only selects specific columns)
create policy "public_select_approved"
  on messages
  for select
  using (status = 'approved');

-- PUBLIC: insert new pending messages only
create policy "public_insert_pending"
  on messages
  for insert
  with check (
    status = 'pending'
    and char_length(name) between 1 and 80
    and char_length(content) between 10 and 1000
    and char_length(moderation_token) = 64
    and approved_by_admin_id is null
    and approved_at is null
  );

-- BLOCK all public updates and deletes
create policy "block_public_update"
  on messages for update using (false);

create policy "block_public_delete"
  on messages for delete using (false);

-- ── Service Role note ────────────────────────────────────────
-- SUPABASE_SERVICE_ROLE_KEY bypasses RLS.
-- All admin operations (approve, reject, delete, user management)
-- use the supabase-admin.ts client which carries this key.

-- ── Initial admin user ───────────────────────────────────────
-- After running this schema, create your first admin via the app's
-- seed script or by inserting directly:
--
-- insert into admin_users (name, email, password_hash, is_active)
-- values ('Your Name', 'you@example.com', '<run hashPassword() to generate>', true);
--
-- Or use the bootstrap endpoint described in README.md.

-- ── Verify ───────────────────────────────────────────────────
-- select id, name, email, is_active from admin_users;
-- select id, name, status, approved_by_admin_id from messages order by created_at desc limit 10;
