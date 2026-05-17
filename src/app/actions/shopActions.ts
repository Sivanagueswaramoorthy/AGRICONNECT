"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- CREATE ORDER ---
export async function createOrder(userId: string, items: any[]) {
  try {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: "PENDING",
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });
    
    revalidatePath("/dashboard/shopowner");
    return { success: true, order };
  } catch (error) {
    console.error("SQL Error (Insert Order):", error);
    return { success: false, error: "Database error" };
  }
}

// --- READ MARKETPLACE ---
export async function getMarketplaceProducts() {
  try {
    return await prisma.product.findMany({
      include: {
        farmer: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("SQL Error (Select Marketplace):", error);
    return [];
  }
}

// --- READ SHOP OWNER ORDERS ---
export async function getShopOwnerOrders(userId: string) {
  try {
    let actualId = userId;
    if (actualId === "shop1") {
      const u = await prisma.user.findFirst({ where: { email: "shop1@agri.com" } });
      if (u) actualId = u.id;
    }

    return await prisma.order.findMany({
      where: { userId: actualId },
      include: {
        items: {
          include: { product: true }
        },
        delivery: true,
        negotiation: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("SQL Error (Select Orders):", error);
    return [];
  }
}

// --- UPDATE ORDER STATUS (e.g. Cancel) ---
export async function cancelOrder(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error) {
    console.error("SQL Error (Update Order):", error);
    return { success: false };
  }
}

// --- DELETE ORDER (Hard delete if needed, though soft-delete via status is better) ---
export async function deleteOrder(orderId: string) {
  try {
    await prisma.order.delete({
      where: { id: orderId }
    });
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error) {
    console.error("SQL Error (Delete Order):", error);
    return { success: false };
  }
}

// --- CART ACTIONS ---
export async function getCart(userId: string) {
  try {
    return await prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { farmer: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Cart Fetch Error:", error);
    return [];
  }
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  try {
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: { userId, productId, quantity }
      });
    }
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

// --- WISHLIST ACTIONS ---
export async function getWishlist(userId: string) {
  try {
    return await prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { farmer: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Wishlist Fetch Error:", error);
    return [];
  }
}

export async function toggleWishlist(userId: string, productId: string) {
  try {
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      revalidatePath("/dashboard/shopowner");
      return { success: true, action: "removed" };
    } else {
      await prisma.wishlistItem.create({ data: { userId, productId } });
      revalidatePath("/dashboard/shopowner");
      return { success: true, action: "added" };
    }
  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    return { success: false };
  }
}

// --- SUBSCRIPTIONS ACTIONS ---
export async function getSubscriptions(userId: string) {
  try {
    return await prisma.subscription.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Subscription Fetch Error:", error);
    return [];
  }
}

export async function createSubscription(data: { userId: string, productId: string, frequency: string, quantity: number, nextDeliveryDate: Date }) {
  try {
    const sub = await prisma.subscription.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        frequency: data.frequency,
        quantity: data.quantity,
        nextDeliveryDate: data.nextDeliveryDate
      }
    });
    revalidatePath("/dashboard/shopowner");
    return { success: true, subscription: sub };
  } catch (error) {
    console.error("Create Sub Error:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}
