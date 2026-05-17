"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- CREATE ---
export async function addProduct(formData: any) {
  try {
    let targetFarmerId = formData.farmerId;
    
    let profile = await prisma.farmerProfile.findUnique({
      where: { id: targetFarmerId }
    });

    if (!profile) {
      profile = await prisma.farmerProfile.findFirst();
    }
    
    if (!profile) {
      throw new Error("Farmer profile not found.");
    }

    if (!profile) {
      return { success: false, error: "SQL Error: No Farmer Profile found. Please seed the database." };
    }

    const product = await prisma.product.create({
      data: {
        farmerId: profile.id,
        name: formData.name,
        category: formData.category || "Vegetables",
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit || "kg",
        price: parseFloat(formData.price) || 0,
        isOrganic: formData.isOrganic === 'true',
        deliveryAvailability: formData.deliveryAvailability || 'BOTH',
        description: formData.description || "",
        image: formData.image || "",
      }
    });

    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/shopowner");
    return { success: true, product };
  } catch (error) {
    console.error("SQL Error (Insert):", error);
    return { success: false, error: "Database rejected the entry. Check your SQL connection." };
  }
}

// --- READ ---
export async function getFarmerProducts(farmerId: string) {
  try {
    let targetId = farmerId;
    // Resilient search
    if (targetId === "farmer1") {
      const profile = await prisma.farmerProfile.findFirst({
        where: { user: { email: "farmer1@agri.com" } }
      });
      if (profile) targetId = profile.id;
    }

    return await prisma.product.findMany({
      where: { farmerId: targetId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("SQL Error (Select):", error);
    return [];
  }
}

// --- UPDATE ---
export async function updateProduct(productId: string, updateData: any) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: updateData.name,
        category: updateData.category,
        quantity: parseFloat(updateData.quantity),
        unit: updateData.unit,
        price: parseFloat(updateData.price),
        isOrganic: updateData.isOrganic === 'true',
        deliveryAvailability: updateData.deliveryAvailability,
        description: updateData.description,
        image: updateData.image,
        updatedAt: new Date()
      }
    });
    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error) {
    console.error("SQL Error (Update):", error);
    return { success: false, error: "Failed to update record" };
  }
}

// --- DELETE ---
export async function deleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId }
    });
    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/shopowner");
    return { success: true };
  } catch (error) {
    console.error("SQL Error (Delete):", error);
    return { success: false, error: "Failed to delete record" };
  }
}

// --- ORDERS READ ---
export async function getFarmerOrders(farmerId: string) {
  try {
    return await prisma.order.findMany({
      where: {
        OR: [
          {
            items: {
              some: {
                product: { farmerId }
              }
            }
          },
          {
            negotiation: {
              farmerId
            }
          }
        ]
      },
      include: {
        user: true,
        items: {
          include: { product: true }
        },
        negotiation: {
          include: { product: true }
        },
        delivery: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("SQL Error (Select Orders):", error);
    return [];
  }
}

// --- PROFILE ---
export async function getFarmerProfileByUserId(userId: string) {
  try {
    // Graceful fallback for local testing without session
    if (userId === "user1") {
      const firstProfile = await prisma.farmerProfile.findFirst();
      if (firstProfile) return firstProfile;
    }

    let profile = await prisma.farmerProfile.findUnique({
      where: { userId }
    });
    
    // Auto-create an empty profile if one doesn't exist for this user
    if (!profile) {
      profile = await prisma.farmerProfile.create({
        data: { userId }
      });
    }
    
    return profile;
  } catch (error) {
    console.error("SQL Error (Select Profile):", error);
    return null;
  }
}

export async function updateFarmerProfile(userId: string, data: any) {
  try {
    const profile = await prisma.farmerProfile.upsert({
      where: { userId },
      update: {
        mobileNumber: data.mobileNumber,
        address: data.address,
        farmLocation: data.farmLocation,
        landArea: data.landArea,
        farmingMethod: data.farmingMethod,
        preferredLang: data.preferredLang,
        aadhaar: data.aadhaar,
        bankDetails: data.bankDetails,
        profilePhoto: data.profilePhoto,
        farmImage: data.farmImage,
        organicStatus: data.organicStatus,
        cropTypes: data.cropTypes
      },
      create: {
        userId,
        mobileNumber: data.mobileNumber,
        address: data.address,
        farmLocation: data.farmLocation,
        landArea: data.landArea,
        farmingMethod: data.farmingMethod,
        preferredLang: data.preferredLang,
        aadhaar: data.aadhaar,
        bankDetails: data.bankDetails,
        profilePhoto: data.profilePhoto,
        farmImage: data.farmImage,
        organicStatus: data.organicStatus,
        cropTypes: data.cropTypes
      }
    });
    revalidatePath("/dashboard/farmer");
    return { success: true, profile };
  } catch (error) {
    console.error("SQL Error (Update Profile):", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// --- CROP MONITORING ---
export async function getCropMonitoring(farmerId: string) {
  try {
    return await prisma.cropMonitoring.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("SQL Error (Select Crops):", error);
    return [];
  }
}

export async function addCropRecord(farmerId: string, data: any) {
  try {
    const crop = await prisma.cropMonitoring.create({
      data: {
        farmerId,
        cropName: data.cropName,
        harvestStatus: data.harvestStatus,
        weatherImpact: data.weatherImpact,
        expectedYield: data.expectedYield,
        aiRecommendation: data.aiRecommendation
      }
    });
    revalidatePath("/dashboard/farmer");
    return { success: true, crop };
  } catch (error) {
    console.error("SQL Error (Add Crop):", error);
    return { success: false };
  }
}
