"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAdminMetrics() {
  try {
    const [
      totalFarmers,
      totalShopOwners,
      totalAgents,
      totalProducts,
      totalNegotiations,
      volumeAggregate,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({ where: { role: "FARMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "DELIVERY" } }),
      prisma.product.count(),
      prisma.negotiation.count(),
      prisma.order.aggregate({
        where: { status: "DELIVERED" },
        _sum: { totalAmount: true }
      }),
      prisma.negotiation.findMany({
        take: 8,
        orderBy: { updatedAt: "desc" },
        include: {
          product: { select: { name: true } },
          buyer: { select: { name: true } }
        }
      })
    ]);

    const totalParticipants = totalFarmers + totalShopOwners + totalAgents;

    return {
      totalParticipants,
      farmers: totalFarmers,
      shopOwners: totalShopOwners,
      agents: totalAgents,
      totalHarvests: totalProducts,
      totalDeals: totalNegotiations,
      totalVolume: volumeAggregate._sum.totalAmount || 0,
      recentActivity
    };
  } catch (error) {
    console.error("Admin Metrics Error:", error);
    return {
      totalParticipants: 0,
      farmers: 0,
      shopOwners: 0,
      agents: 0,
      totalHarvests: 0,
      totalDeals: 0,
      totalVolume: 0,
      recentActivity: []
    };
  }
}
