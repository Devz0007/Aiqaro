/*
  Warnings:

  - Added the required column `updated_by` to the `bookmarks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookmarks" ADD COLUMN     "is_bookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_by" TEXT NOT NULL,
ADD COLUMN     "updated_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
