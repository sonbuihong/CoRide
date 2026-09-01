-- New drivers start at 5.0. Only users without any driver review are
-- backfilled, so existing review-derived ratings are preserved.
ALTER TABLE "User"
ALTER COLUMN "driverRating" SET DEFAULT 5;

UPDATE "User"
SET "driverRating" = 5
WHERE "driverRatingCount" = 0
  AND "driverRating" <> 5;
