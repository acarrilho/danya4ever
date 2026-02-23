-- ============================================================
-- Danya Memorial Board — Supabase SQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- Create messages table
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (char_length(name) between 1 and 80),
  content     text not null check (char_length(content) between 10 and 1000),
  created_at  timestamp with time zone default now() not null
);

-- Index for fast ordering
create index if not exists messages_created_at_idx on messages (created_at desc);

-- Enable Row Level Security
alter table messages enable row level security;

-- Policy: anyone can read all messages
create policy "Public can read messages"
  on messages
  for select
  using (true);

-- Policy: anyone can insert a message
create policy "Public can insert messages"
  on messages
  for insert
  with check (
    char_length(name) between 1 and 80
    and char_length(content) between 10 and 1000
  );

-- Optional: prevent updates and deletes from public
-- (Only authenticated admins can modify existing messages)
create policy "No public updates"
  on messages
  for update
  using (false);

create policy "No public deletes"
  on messages
  for delete
  using (false);
