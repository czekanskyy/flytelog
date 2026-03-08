-- Migration: remove_approved_expiresat
-- Generated: 2026-03-07
-- Description: Drops `approved` and `expiresAt` columns from User table.
--
-- WARNING: This migration is DESTRUCTIVE. The `approved` column currently
-- has 3 non-null rows in production. Make sure all team members are aware
-- before applying this migration.
--
-- To apply: bunx prisma migrate deploy (or prisma db execute --file this_file.sql)

ALTER TABLE "public"."User" DROP COLUMN "approved";
ALTER TABLE "public"."User" DROP COLUMN "expiresAt";
