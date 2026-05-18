"use server";

import { prisma } from "@/lib/prisma";

export async function deleteUserAccount(identifier: string) {
  if (!identifier) throw new Error("User identifier is required");

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { name: identifier }
        ]
      },
      include: {
        farmerProfile: true,
      }
    });

    if (!user) {
      return { success: false, error: "User account not found." };
    }

    const userId = user.id;
    const farmerProfileId = user.farmerProfile?.id || "NO_FARMER_PROFILE";

    // 1. Set Order negotiationId to null for orders related to this user to prevent constraint violations
    await prisma.order.updateMany({
      where: {
        OR: [
          { userId: userId },
          { negotiation: { farmerId: farmerProfileId } }
        ]
      },
      data: {
        negotiationId: null
      }
    });

    // 2. Delete OrderItems for orders belonging to this user
    await prisma.orderItem.deleteMany({
      where: {
        OR: [
          { order: { userId: userId } },
          { order: { negotiation: { farmerId: farmerProfileId } } }
        ]
      }
    });

    // 3. Delete Deliveries belonging to this user
    await prisma.delivery.deleteMany({
      where: {
        OR: [
          { deliveryBoyId: userId },
          { order: { userId: userId } },
          { order: { negotiation: { farmerId: farmerProfileId } } }
        ]
      }
    });

    // 4. Delete Orders belonging to this user
    await prisma.order.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { negotiation: { farmerId: farmerProfileId } }
        ]
      }
    });

    // 5. Delete Negotiations belonging to this user
    await prisma.negotiation.deleteMany({
      where: {
        OR: [
          { buyerId: userId },
          { farmerId: farmerProfileId }
        ]
      }
    });

    // 6. Delete crop monitoring records
    if (user.farmerProfile) {
      await prisma.cropMonitoring.deleteMany({
        where: { farmerId: farmerProfileId }
      });
    }

    // 7. Delete reviews
    await prisma.review.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { product: { farmerId: farmerProfileId } }
        ]
      }
    });

    // 8. Delete Wishlist items
    await prisma.wishlistItem.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { product: { farmerId: farmerProfileId } }
        ]
      }
    });

    // 9. Delete Cart items
    await prisma.cartItem.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { product: { farmerId: farmerProfileId } }
        ]
      }
    });

    // 10. Delete Subscriptions
    await prisma.subscription.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { product: { farmerId: farmerProfileId } }
        ]
      }
    });

    // 11. Delete Products belonging to this user's profile
    if (user.farmerProfile) {
      await prisma.product.deleteMany({
        where: { farmerId: farmerProfileId }
      });
    }

    // 12. Delete profiles
    if (user.farmerProfile) {
      await prisma.farmerProfile.delete({
        where: { id: farmerProfileId }
      });
    }

    // 13. Delete accounts and sessions
    await prisma.account.deleteMany({ where: { userId: userId } });
    await prisma.session.deleteMany({ where: { userId: userId } });

    // 14. Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete account:", error);
    return { success: false, error: error.message || "An unknown error occurred while deleting account." };
  }
}
