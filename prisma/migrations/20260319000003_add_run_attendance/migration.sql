CREATE TABLE "RunAttendance" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "runId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "RunAttendance_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "RunAttendance" ADD CONSTRAINT "RunAttendance_runId_fkey" FOREIGN KEY ("runId") REFERENCES "GroupRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunAttendance" ADD CONSTRAINT "RunAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "RunAttendance_runId_userId_key" ON "RunAttendance"("runId", "userId");
