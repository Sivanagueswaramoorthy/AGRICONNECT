"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to resolve delivery agent ID
async function resolveAgentId(agentId: string) {
  let actualId = agentId;
  if (actualId === "agent1" || actualId === "del1" || actualId === "agent_default") {
    const u = await prisma.user.findFirst({ where: { email: "del1@agri.com" } });
    if (u) actualId = u.id;
  } else if (actualId === "del2") {
    const u = await prisma.user.findFirst({ where: { email: "del2@agri.com" } });
    if (u) actualId = u.id;
  }
  return actualId;
}

export async function getDeliveryAssignments(agentId: string) {
  try {
    const resolvedId = await resolveAgentId(agentId);

    // Fetch deliveries assigned to this driver
    return await prisma.delivery.findMany({
      where: { deliveryBoyId: resolvedId },
      include: {
        order: {
          include: {
            user: true,
            negotiation: {
              include: {
                product: {
                  include: {
                    farmer: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Delivery Assignment Error:", error);
    return [];
  }
}

export async function respondToDeliveryRequest(deliveryId: string, accept: boolean) {
  try {
    const status = accept ? "ACCEPTED" : "REJECTED";
    const orderStatus = accept ? "TRANSPORT_ACCEPTED" : "DELIVERY_REJECTED";

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status },
      include: { order: true }
    });

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: orderStatus }
    });

    revalidatePath("/dashboard/delivery");
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error) {
    console.error("Respond Delivery Request Error:", error);
    return { success: false };
  }
}

export async function updateDeliveryStatus(deliveryId: string, status: string) {
  try {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status }
    });

    // Mirror status changes on the Order
    let orderStatus = "TRANSPORT_ACCEPTED";
    if (status === "SHIPPED") {
      orderStatus = "SHIPPED";
    } else if (status === "DELIVERED") {
      orderStatus = "DELIVERED";
    }

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: orderStatus }
    });

    revalidatePath("/dashboard/delivery");
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error) {
    console.error("Update Delivery Status Error:", error);
    return { success: false };
  }
}

export async function getRegisteredDeliveryPartners() {
  try {
    return await prisma.user.findMany({
      where: { role: "DELIVERY" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
  } catch (error) {
    console.error("Get Registered Delivery Partners Error:", error);
    return [];
  }
}

export async function getDeliveryAgentProfile(agentId: string) {
  try {
    const resolvedId = await resolveAgentId(agentId);
    
    // Find the user details
    const user = await prisma.user.findUnique({
      where: { id: resolvedId }
    });

    // Find their most recent assigned order to get their mobile number
    const recentOrder = await prisma.order.findFirst({
      where: { deliveryAgentId: resolvedId },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      name: user?.name || "Rajan Kumar",
      email: user?.email || "del1@agri.com",
      mobile: recentOrder?.deliveryAgentMobile || "+91 9876543210"
    };
  } catch (error) {
    console.error("Get Delivery Agent Profile Error:", error);
    return { success: false };
  }
}

export async function updateDeliveryAgentProfile(agentId: string, name: string, email: string, mobile: string) {
  try {
    const resolvedId = await resolveAgentId(agentId);

    // 1. Update the User's name and email in the database
    await prisma.user.update({
      where: { id: resolvedId },
      data: { name, email }
    });

    // 2. Update the deliveryAgentName and deliveryAgentMobile on ALL orders assigned to this agent
    await prisma.order.updateMany({
      where: { deliveryAgentId: resolvedId },
      data: {
        deliveryAgentName: name,
        deliveryAgentMobile: mobile
      }
    });

    revalidatePath("/dashboard/delivery");
    revalidatePath("/dashboard/shopowner");
    revalidatePath("/dashboard/farmer");
    return { success: true };
  } catch (error) {
    console.error("Update Delivery Agent Profile Error:", error);
    return { success: false, error: "Database update failed" };
  }
}
