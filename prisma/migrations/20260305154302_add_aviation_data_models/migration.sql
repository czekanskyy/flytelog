-- CreateTable
CREATE TABLE "Airport" (
    "id" TEXT NOT NULL,
    "openaipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icaoCode" TEXT,
    "type" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "geometry" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airspace" (
    "id" TEXT NOT NULL,
    "openaipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "icaoClass" INTEGER,
    "upperLimit" DOUBLE PRECISION,
    "lowerLimit" DOUBLE PRECISION,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "geometry" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Navaid" (
    "id" TEXT NOT NULL,
    "openaipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "frequency" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Navaid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obstacle" (
    "id" TEXT NOT NULL,
    "openaipId" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION NOT NULL,
    "heightAgl" DOUBLE PRECISION NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obstacle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemsUpdated" INTEGER NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airport_openaipId_key" ON "Airport"("openaipId");

-- CreateIndex
CREATE INDEX "Airport_country_idx" ON "Airport"("country");

-- CreateIndex
CREATE INDEX "Airport_lat_lon_idx" ON "Airport"("lat", "lon");

-- CreateIndex
CREATE UNIQUE INDEX "Airspace_openaipId_key" ON "Airspace"("openaipId");

-- CreateIndex
CREATE INDEX "Airspace_country_idx" ON "Airspace"("country");

-- CreateIndex
CREATE INDEX "Airspace_type_idx" ON "Airspace"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Navaid_openaipId_key" ON "Navaid"("openaipId");

-- CreateIndex
CREATE INDEX "Navaid_country_idx" ON "Navaid"("country");

-- CreateIndex
CREATE INDEX "Navaid_lat_lon_idx" ON "Navaid"("lat", "lon");

-- CreateIndex
CREATE UNIQUE INDEX "Obstacle_openaipId_key" ON "Obstacle"("openaipId");

-- CreateIndex
CREATE INDEX "Obstacle_country_idx" ON "Obstacle"("country");

-- CreateIndex
CREATE INDEX "Obstacle_lat_lon_idx" ON "Obstacle"("lat", "lon");
