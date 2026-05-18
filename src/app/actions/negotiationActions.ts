"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createNegotiation(data: any) {
  try {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found.");

    let buyer = null;
    if (data.buyerId && data.buyerId !== "shop1") {
      buyer = await prisma.user.findUnique({ where: { id: data.buyerId } });
    }
    if (!buyer) {
      buyer = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
    }
    if (!buyer) {
      buyer = await prisma.user.findFirst({ where: { role: "SHOP_OWNER" } });
    }
    if (!buyer) {
      buyer = await prisma.user.findFirst();
    }
    if (!buyer) throw new Error("Buyer account not found in database.");

    const negotiation = await prisma.negotiation.create({
      data: {
        productId: data.productId,
        buyerId: buyer.id,
        farmerId: product.farmerId,
        offeredPrice: parseFloat(data.offeredPrice),
        offeredQuantity: parseFloat(data.offeredQuantity),
        status: "PENDING"
      }
    });

    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true, negotiation };
  } catch (error: any) {
    console.error("SQL Create Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBargainPrice(id: string, price: number) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { offeredPrice: price, status: "PENDING" }
    });
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function counterNegotiation(id: string, price: number) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { offeredPrice: price, status: "COUNTERED" }
    });
    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function buyerAcceptOffer(id: string) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { status: "BUYER_ACCEPTED" }
    });
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function farmerAcceptOffer(id: string) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { status: "ACCEPTED" }
    });
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkoutNegotiation(
  id: string, 
  deliveryType: "SELF" | "AGENT",
  options?: { agentId?: string; agentName?: string; agentMobile?: string; pickupDate?: string | Date }
) {
  try {
    const neg = await prisma.negotiation.update({
      where: { id },
      data: { status: "ORDER_PLACED" },
      include: { product: true }
    });

    const isSelf = deliveryType === "SELF";
    const agentName = isSelf ? "Self Pickup" : (options?.agentName || "Assigned Agent");
    const agentMobile = isSelf ? "N/A" : (options?.agentMobile || "N/A");
    const agentId = isSelf ? null : (options?.agentId || "agent_default");
    const pDate = options?.pickupDate ? new Date(options.pickupDate) : new Date(Date.now() + 86400000 * 2);

    let actualAgentId = agentId;
    if (agentId === "del1") {
      const u = await prisma.user.findFirst({ where: { email: "del1@agri.com" } });
      if (u) actualAgentId = u.id;
    } else if (agentId === "del2") {
      const u = await prisma.user.findFirst({ where: { email: "del2@agri.com" } });
      if (u) actualAgentId = u.id;
    } else if (agentId === "del3") {
      const u = await prisma.user.findFirst({ where: { name: "EcoTransport" } });
      if (u) actualAgentId = u.id;
    }

    const existingOrder = await prisma.order.findUnique({
      where: { negotiationId: id }
    });

    let orderId: string;

    if (existingOrder) {
      const updatedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          deliveryDate: pDate,
          deliveryAgentId: actualAgentId,
          deliveryAgentName: agentName,
          deliveryAgentMobile: agentMobile,
          status: isSelf ? "ACCEPTED" : "PENDING_DELIVERY"
        }
      });
      orderId = updatedOrder.id;

      await prisma.delivery.deleteMany({
        where: { orderId: orderId }
      });
    } else {
      const newOrder = await prisma.order.create({
        data: {
          userId: neg.buyerId,
          negotiationId: neg.id,
          totalAmount: neg.offeredPrice * neg.offeredQuantity,
          status: isSelf ? "ACCEPTED" : "PENDING_DELIVERY",
          deliveryDate: pDate,
          deliveryAgentId: actualAgentId,
          deliveryAgentName: agentName,
          deliveryAgentMobile: agentMobile
        }
      });
      orderId = newOrder.id;
    }

    if (!isSelf && actualAgentId) {
      await prisma.delivery.create({
        data: {
          orderId: orderId,
          deliveryBoyId: actualAgentId,
          status: "ASSIGNED",
          estimatedTime: pDate
        }
      });
    }

    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function confirmCounterOffer(id: string) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { status: "PENDING" }
    });
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNegotiationsForBuyer(buyerId: string) {
  try {
    let actualId = buyerId;
    // Fallback for local testing
    if (actualId === "shop1") {
      const u = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
      if (u) actualId = u.id;
      else {
        const anyUser = await prisma.user.findFirst();
        if (anyUser) actualId = anyUser.id;
      }
    }
    
    let list = await prisma.negotiation.findMany({
      where: { buyerId: actualId },
      include: { product: true, farmer: { include: { user: true } } },
      orderBy: { updatedAt: "desc" }
    });

    if (list.length === 0) {
      const u = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
      if (u && u.id !== actualId) {
        list = await prisma.negotiation.findMany({
          where: { buyerId: u.id },
          include: { product: true, farmer: { include: { user: true } } },
          orderBy: { updatedAt: "desc" }
        });
      }
    }

    return list;
  } catch (error) {
    console.error("Get Buyer Negs Error:", error);
    return [];
  }
}

export async function getNegotiationsForFarmer(farmerId: string) {
  try {
    let actualId = farmerId;
    // Fallback for local testing
    if (actualId === "farmer1") {
      const f = await prisma.farmerProfile.findFirst();
      if (f) actualId = f.id;
    }

    return await prisma.negotiation.findMany({
      where: { farmerId: actualId },
      include: { product: true, buyer: true },
      orderBy: { updatedAt: "desc" }
    });
  } catch (error) {
    console.error("Get Farmer Negs Error:", error);
    return [];
  }
}

export async function rejectNegotiation(id: string) {
  try {
    await prisma.negotiation.update({
      where: { id },
      data: { status: "REJECTED" }
    });
    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
