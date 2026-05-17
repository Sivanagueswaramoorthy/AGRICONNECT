const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("Checking for tables in the database...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables found:", tables.map(t => t.table_name).join(", "));
    
    const negTable = tables.find(t => t.table_name === 'Negotiation');
    if (negTable) {
      console.log("SUCCESS: 'Negotiation' table exists!");
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Negotiation'
      `;
      console.log("Columns:", columns.map(c => `${c.column_name} (${c.data_type})`).join(", "));
    } else {
      console.log("ERROR: 'Negotiation' table DOES NOT exist!");
    }
  } catch (err) {
    console.error("SQL Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
