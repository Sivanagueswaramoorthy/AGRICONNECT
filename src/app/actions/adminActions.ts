"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAdminMetrics() {
  try {
    const [
      farmersList,
      shopOwnersList,
      agentsList,
      productsList,
      negotiationsList,
      ordersList,
      deliveriesList
    ] = await Promise.all([
      prisma.user.findMany({
        where: { role: "FARMER" },
        include: { farmerProfile: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.findMany({
        where: { role: "SHOP_OWNER" },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.findMany({
        where: { role: "DELIVERY" },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.findMany({
        include: { farmer: { include: { user: true } } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.negotiation.findMany({
        include: {
          product: true,
          buyer: true,
          farmer: { include: { user: true } }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.order.findMany({
        include: {
          user: true,
          negotiation: { include: { product: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.delivery.findMany({
        include: {
          order: { include: { negotiation: { include: { product: true } } } },
          deliveryBoy: true
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const farmersCount = farmersList.length;
    const shopOwnersCount = shopOwnersList.length;
    const agentsCount = agentsList.length;
    const totalParticipants = farmersCount + shopOwnersCount + agentsCount;

    const totalVolume = ordersList
      .filter((o) => o.status === "DELIVERED" || o.status === "SHIPPED" || o.status === "TRANSPORT_ACCEPTED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      success: true,
      totalParticipants,
      farmers: farmersCount,
      shopOwners: shopOwnersCount,
      agents: agentsCount,
      totalHarvests: productsList.length,
      totalDeals: negotiationsList.length,
      totalVolume,
      farmersList,
      shopOwnersList,
      agentsList,
      productsList,
      negotiationsList,
      ordersList,
      deliveriesList
    };
  } catch (error) {
    console.error("Admin Metrics Error:", error);
    return {
      success: false,
      totalParticipants: 0,
      farmers: 0,
      shopOwners: 0,
      agents: 0,
      totalHarvests: 0,
      totalDeals: 0,
      totalVolume: 0,
      farmersList: [],
      shopOwnersList: [],
      agentsList: [],
      productsList: [],
      negotiationsList: [],
      ordersList: [],
      deliveriesList: []
    };
  }
}

export async function deleteProductAdmin(productId: string) {
  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to moderate product" };
  }
}

export async function updateAadhaarStatus(profileId: string, aadhaar: string) {
  try {
    await prisma.farmerProfile.update({
      where: { id: profileId },
      data: { aadhaar }
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update Aadhaar" };
  }
}
