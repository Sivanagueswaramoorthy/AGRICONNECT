import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "sivanagu7771@gmail.com" } });
  if (!user) return console.log("User not found");
  
  let profile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.farmerProfile.create({ data: { userId: user.id } });
  }

  // Update all products to belong to this farmer
  await prisma.product.updateMany({
    data: { farmerId: profile.id }
  });

  // Update all crop monitorings
  await prisma.cropMonitoring.updateMany({
    data: { farmerId: profile.id }
  });

  // Update negotiations (buyer is user.id, farmer is profile.id)
  await prisma.negotiation.updateMany({
    data: { buyerId: user.id, farmerId: profile.id }
  });

  // Update orders
  await prisma.order.updateMany({
    data: { userId: user.id }
  });

  console.log("Database successfully migrated to be dynamic for", user.email);
}
main().catch(console.error).finally(() => prisma.$disconnect());
