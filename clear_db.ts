import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database transaction sweep...");

  // 1. Delete logistics & delivery records
  const deliveryDel = await prisma.delivery.deleteMany();
  console.log(`- Deleted ${deliveryDel.count} delivery records`);

  // 2. Delete order items
  const orderItemsDel = await prisma.orderItem.deleteMany();
  console.log(`- Deleted ${orderItemsDel.count} order item entries`);

  // 3. Delete orders
  const ordersDel = await prisma.order.deleteMany();
  console.log(`- Deleted ${ordersDel.count} order records`);

  // 4. Delete negotiations
  const negotiationsDel = await prisma.negotiation.deleteMany();
  console.log(`- Deleted ${negotiationsDel.count} negotiation records`);

  // 5. Delete crop monitoring records
  const cropMonDel = await prisma.cropMonitoring.deleteMany();
  console.log(`- Deleted ${cropMonDel.count} crop monitoring records`);

  // 6. Delete reviews
  const reviewsDel = await prisma.review.deleteMany();
  console.log(`- Deleted ${reviewsDel.count} review records`);

  // 7. Delete cart items
  const cartDel = await prisma.cartItem.deleteMany();
  console.log(`- Deleted ${cartDel.count} cart items`);

  // 8. Delete wishlist items
  const wishlistDel = await prisma.wishlistItem.deleteMany();
  console.log(`- Deleted ${wishlistDel.count} wishlist items`);

  // 9. Delete subscriptions
  const subDel = await prisma.subscription.deleteMany();
  console.log(`- Deleted ${subDel.count} subscriptions`);

  // 10. Delete products
  const productsDel = await prisma.product.deleteMany();
  console.log(`- Deleted ${productsDel.count} products`);

  console.log("\n✅ Success: Database sweep completed! All transactional tables are now completely empty, ready for you to add your own data!");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
