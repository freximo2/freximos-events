-- CreateTable
CREATE TABLE "event_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'PUBLIC',
    "category" "EventCategory" NOT NULL DEFAULT 'FUTBOL',
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "max_players" INTEGER NOT NULL DEFAULT 10,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "creator_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_templates_pkey" PRIMARY KEY ("id")
);
