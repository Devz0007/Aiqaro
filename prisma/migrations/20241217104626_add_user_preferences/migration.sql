-- CreateTable
CREATE TABLE "user_study_preferences" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "therapeuticArea" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_study_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_study_preferences_userId_key" ON "user_study_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_study_preferences" ADD CONSTRAINT "user_study_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
