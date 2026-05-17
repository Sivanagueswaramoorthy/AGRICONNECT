const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkCase() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 FROM "Negotiation" LIMIT 1`;
    console.log("Quotes 'Negotiation' works.");
  } catch (e) {
    console.log("Quotes 'Negotiation' FAILS:", e.message);
  }

  try {
    const res = await prisma.$queryRaw`SELECT 1 FROM Negotiation LIMIT 1`;
    console.log("Unquoted Negotiation works.");
  } catch (e) {
    console.log("Unquoted Negotiation FAILS:", e.message);
  }

  try {
    const res = await prisma.$queryRaw`SELECT 1 FROM negotiation LIMIT 1`;
    console.log("Lowercase negotiation works.");
  } catch (e) {
    console.log("Lowercase negotiation FAILS:", e.message);
  }
}

checkCase().finally(() => prisma.$disconnect());
