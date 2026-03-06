-- CreateTable
CREATE TABLE "ReportingPoint" (
    "id" TEXT NOT NULL,
    "openaipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPoint_openaipId_key" ON "ReportingPoint"("openaipId");

-- CreateIndex
CREATE INDEX "ReportingPoint_country_idx" ON "ReportingPoint"("country");

-- CreateIndex
CREATE INDEX "ReportingPoint_lat_lon_idx" ON "ReportingPoint"("lat", "lon");
