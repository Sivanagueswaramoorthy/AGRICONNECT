import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:");
  users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));

  const orders = await prisma.order.findMany({
    include: {
      negotiation: true
    }
  });
  console.log("Orders count:", orders.length);
  orders.forEach(o => console.log(`- OrderID: ${o.id}, UserID: ${o.userId}, Total: ${o.totalAmount}, Status: ${o.status}, Agent: ${o.deliveryAgentName}, NegID: ${o.negotiationId}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
