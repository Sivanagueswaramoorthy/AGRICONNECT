const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123", 10);
  const adminPassword = await bcrypt.hash("admin", 10);

  console.log("Cleaning up existing data...");
  await prisma.negotiation.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farmerProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding new data...");

  // Admin
  await prisma.user.create({
    data: {
      email: "admin@agri.com",
      name: "System Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Shop Owner
  const shopOwner = await prisma.user.create({
    data: {
      email: "shop1@agri.com",
      name: "Agri Market Store",
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  // Delivery Partners
  const del1 = await prisma.user.create({
    data: {
      email: "del1@agri.com",
      name: "Rajesh Tukaram",
      password: hashedPassword,
      role: "DELIVERY",
    },
  });

  const del2 = await prisma.user.create({
    data: {
      email: "del2@agri.com",
      name: "Suresh Patil",
      password: hashedPassword,
      role: "DELIVERY",
    },
  });

  // Farmers
  const farmer1 = await prisma.user.create({
    data: {
      email: "farmer1@agri.com",
      name: "Ramesh Kumar",
      password: hashedPassword,
      role: "FARMER",
    },
  });

  const farmerProfile1 = await prisma.farmerProfile.create({
    data: {
      userId: farmer1.id,
      farmLocation: "Nashik Highway, Gate 4",
      mobileNumber: "+91 98765 43210",
    },
  });

  // Products
  const categories = ["Vegetables", "Fruits", "Grains", "Dairy"];
  const productNames = [
    "Organic Vine Tomatoes", "Red Onions", "Alphonso Mangoes", "Basmati Rice",
    "Fresh A2 Cow Milk", "Green Chillies", "Baby Spinach", "Nagpur Oranges",
    "Wheat Grain", "Potatoes (Grade A)", "Sweet Corn", "Broccoli"
  ];

  const products = [];
  for (let i = 0; i < productNames.length; i++) {
    const p = await prisma.product.create({
      data: {
        farmerId: farmerProfile1.id,
        name: productNames[i],
        category: categories[i % categories.length],
        quantity: Math.floor(Math.random() * 1000) + 100,
        unit: i === 4 ? "liter" : "kg",
        price: Math.floor(Math.random() * 100) + 20,
        isOrganic: i % 2 === 0,
        description: `Premium quality ${productNames[i]} directly from the farm.`,
      },
    });
    products.push(p);
  }

  // Negotiations
  console.log("Creating sample negotiations...");
  await prisma.negotiation.create({
    data: {
      productId: products[0].id,
      buyerId: shopOwner.id,
      farmerId: farmerProfile1.id,
      offeredPrice: 20,
      offeredQuantity: 100,
      status: "PENDING",
    },
  });

  await prisma.negotiation.create({
    data: {
      productId: products[1].id,
      buyerId: shopOwner.id,
      farmerId: farmerProfile1.id,
      offeredPrice: 28,
      offeredQuantity: 500,
      status: "ACCEPTED",
    },
  });

  await prisma.negotiation.create({
    data: {
      productId: products[2].id,
      buyerId: shopOwner.id,
      farmerId: farmerProfile1.id,
      offeredPrice: 150,
      offeredQuantity: 50,
      status: "REJECTED",
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
