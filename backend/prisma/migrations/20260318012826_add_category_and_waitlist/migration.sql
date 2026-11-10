-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('FUTBOL', 'BASKETBALL', 'BAILE', 'BOLOS', 'REUNION', 'OTRO');

-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'WAITLISTED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" "EventCategory" NOT NULL DEFAULT 'FUTBOL';
