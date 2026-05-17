const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debug() {
  try {
    console.log("Checking database connection...");
    const userCount = await prisma.user.count();
    console.log(`Users in DB: ${userCount}`);

    const product = await prisma.product.findFirst();
    if (!product) {
      console.log("ERROR: No products found. Seed might have failed.");
      return;
    }
    console.log(`Found product: ${product.name} (${product.id})`);

    const buyer = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
    if (!buyer) {
      console.log("ERROR: Buyer (shop1@agri.com) not found.");
      return;
    }
    console.log(`Found buyer: ${buyer.name} (${buyer.id})`);

    console.log("Attempting to create negotiation...");
    const neg = await prisma.negotiation.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        farmerId: product.farmerId,
        offeredPrice: 10,
        offeredQuantity: 100,
        status: "PENDING"
      }
    });
    console.log("SUCCESS: Negotiation created!", neg.id);

  } catch (err) {
    console.error("DEBUG ERROR:", err.message);
    if (err.code === 'P2003') {
      console.log("Foreign key constraint failed. Check if IDs exist in related tables.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

debug();
