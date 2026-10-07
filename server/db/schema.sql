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
ALTER TABLE wolgye.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolgye.discord_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA wolgye FROM PUBLIC;
-- Supabase postgres connection owns these tables. No browser/anonymous policies.
COMMIT;
