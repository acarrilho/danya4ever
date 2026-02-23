-- ============================================================
-- Danya Memorial Board v2 — Supabase SQL Schema
-- Includes moderation workflow + RLS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing table if upgrading from v1 (uncomment if needed):
-- drop table if exists messages;

-- Create messages table
create table if not exists messages (
  id                uuid        primary key default uuid_generate_v4(),
  name              text        not null check (char_length(name) between 1 and 80),
  content           text        not null check (char_length(content) between 10 and 1000),
  status            text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_token  text        not null,
  created_at        timestamptz not null default now(),
  approved_at       timestamptz
);

-- Index for public board (only approved, newest first)
create index if not exists messages_approved_idx
  on messages (created_at desc)
  where status = 'approved';

-- Index for admin dashboard
create index if not exists messages_status_idx on messages (status, created_at desc);

-- Row Level Security
alter table messages enable row level security;

-- PUBLIC: read only approved messages
create policy "public_select_approved"
  on messages
  for select
  using (status = 'approved');

-- PUBLIC: insert new messages (always pending)
create policy "public_insert_pending"
  on messages
  for insert
  with check (
    status = 'pending'
    and char_length(name) between 1 and 80
    and char_length(content) between 10 and 1000
    and char_length(moderation_token) = 64
  );

-- BLOCK all public updates and deletes
create policy "block_public_update"
  on messages
  for update
  using (false);

create policy "block_public_delete"
  on messages
  for delete
  using (false);

-- NOTE: The SUPABASE_SERVICE_ROLE_KEY bypasses RLS automatically.
-- All admin operations (approve, reject, delete) use the service role client.
