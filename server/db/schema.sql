-- Server-only schema. Never expose member tokens or owner hashes through Data API.
BEGIN;
CREATE SCHEMA IF NOT EXISTS wolgye;
REVOKE ALL ON SCHEMA wolgye FROM PUBLIC;
CREATE TABLE IF NOT EXISTS wolgye.places (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id)
);
CREATE TABLE IF NOT EXISTS wolgye.posts (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id)
);
CREATE INDEX IF NOT EXISTS posts_place ON wolgye.posts ((data->>'placeId'));
CREATE TABLE IF NOT EXISTS wolgye.groups (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id)
);
CREATE TABLE IF NOT EXISTS wolgye.discord_memberships (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.place_info (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'placeId' = id)
);
CREATE TABLE IF NOT EXISTS wolgye.owner_accounts (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.owner_campaigns (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.owner_proposals (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.owner_views (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.owner_keywords (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.owner_coupons (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.user_rewards (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS wolgye.user_data (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
);
ALTER TABLE wolgye.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.owner_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.place_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.discord_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA wolgye FROM PUBLIC;
-- Supabase postgres connection owns these tables. No browser/anonymous policies.
COMMIT;
