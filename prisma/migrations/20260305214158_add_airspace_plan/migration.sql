-- CreateTable
CREATE TABLE "AirspacePlan" (
    "id" TEXT NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "planType" TEXT NOT NULL,
    "designator" TEXT NOT NULL,
    "lowerLimit" TEXT NOT NULL,
    "upperLimit" TEXT NOT NULL,
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "unit" TEXT,
    "fuaStatus" TEXT,
    "remarks" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirspacePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AirspacePlan_planDate_idx" ON "AirspacePlan"("planDate");

-- CreateIndex
CREATE INDEX "AirspacePlan_designator_idx" ON "AirspacePlan"("designator");

-- CreateIndex
CREATE INDEX "AirspacePlan_planDate_designator_idx" ON "AirspacePlan"("planDate", "designator");
