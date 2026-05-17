"use server";

import { prisma } from "@/lib/prisma";

export async function getFarmerStats(farmerId: string) {
  try {
    let targetId = farmerId;
    if (targetId === "farmer1") {
      const profile = await prisma.farmerProfile.findFirst({
        where: { user: { email: "farmer1@agri.com" } }
      });
      if (profile) targetId = profile.id;
    }

    const [listings, bargains, pendingCount] = await Promise.all([
      prisma.product.aggregate({
        where: { farmerId: targetId },
        _count: { id: true },
        _sum: { quantity: true }
      }),
      prisma.order.aggregate({
        where: { negotiation: { farmerId: targetId }, status: "DELIVERED" },
        _sum: { totalAmount: true }
      }),
      prisma.negotiation.count({
        where: { farmerId: targetId, status: "PENDING" }
      })
    ]);

    return {
      totalListings: listings._count.id || 0,
      totalQuantity: listings._sum.quantity || 0,
      earnings: bargains._sum.totalAmount || 0,
      pendingBargains: pendingCount
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return { totalListings: 0, totalQuantity: 0, earnings: 0, pendingBargains: 0 };
  }
}

export async function getShopOwnerStats(shopId: string) {
  try {
    let actualId = shopId;
    if (actualId === "shop1") {
      const u = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
      if (u) actualId = u.id;
    }

    const [negotiations, activeOrders, spending] = await Promise.all([
      prisma.negotiation.count({ where: { buyerId: actualId, status: "COUNTERED" } }),
      prisma.order.count({ where: { userId: actualId, status: { in: ["PENDING", "ACCEPTED", "SHIPPED"] } } }),
      prisma.order.aggregate({
        where: { userId: actualId, status: "DELIVERED" },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      counterOffers: negotiations,
      activeOrders: activeOrders,
      totalSpent: spending._sum.totalAmount || 0
    };
  } catch (error) {
    console.error("Shop Stats Error:", error);
    return { counterOffers: 0, activeOrders: 0, totalSpent: 0 };
  }
}
