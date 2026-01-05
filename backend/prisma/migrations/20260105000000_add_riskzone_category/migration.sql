-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('DRUGS', 'WEAPONS', 'TRAFFIC', 'VIOLENT', 'THEFT', 'OTHER');

-- AlterTable
ALTER TABLE "RiskZone" ADD COLUMN     "category" "RiskCategory" NOT NULL DEFAULT 'OTHER';
