/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("../lib/generated/prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedDosen = await bcrypt.hash("dosen123", 12);
  const hashedMahasiswa = await bcrypt.hash("mahasiswa123", 12);

  // Create default dosen
  const dosen = await prisma.user.upsert({
    where: { email: "dosen@tekniksipil.ac.id" },
    update: {},
    create: {
      name: "Admin Dosen",
      email: "dosen@tekniksipil.ac.id",
      password: hashedDosen,
      role: "DOSEN",
    },
  });
  console.log(`  Dosen: ${dosen.email} (password: dosen123)`);

  // Create test mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: "mahasiswa@test.com" },
    update: {},
    create: {
      name: "Mahasiswa Test",
      email: "mahasiswa@test.com",
      password: hashedMahasiswa,
      role: "MAHASISWA",
    },
  });
  console.log(`  Mahasiswa: ${mahasiswa.email} (password: mahasiswa123)`);

  // Update existing materials and quizzes to belong to dosen
  const materialCount = await prisma.material.updateMany({
    where: { createdById: null },
    data: { createdById: dosen.id, isPublished: true },
  });
  console.log(`  Updated ${materialCount.count} materials -> dosen + published`);

  const quizCount = await prisma.quiz.updateMany({
    where: { createdById: null },
    data: { createdById: dosen.id, isPublished: true },
  });
  console.log(`  Updated ${quizCount.count} quizzes -> dosen + published`);

  console.log("Seed complete!");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
