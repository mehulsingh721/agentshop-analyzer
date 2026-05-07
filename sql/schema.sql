-- Run this in the Supabase SQL editor.
-- Single table; the 6 pipeline step results are embedded as a JSON array.

create extension if not exists "pgcrypto";

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  brand_url text not null,
  category text not null,
  competitors jsonb not null default '[]'::jsonb,
  status text not null default 'pending',           -- pending | running | completed | failed
  current_step int not null default 0,              -- 0..6
  steps jsonb not null default '[]'::jsonb,         -- StepRecord[]
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audits_created_at_idx on audits (created_at desc);
