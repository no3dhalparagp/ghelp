
"use server"

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// Fetch warish details by ID
export async function getWarishDetailsById(applicationId: string) {
  return await db.warishApplication.findUnique({
    where: { id: applicationId },
    include: {
      gpProfile: true,
    },
  })
}

// Update Warish Details
export async function updateWarishDetails(applicationId: string, data: Prisma.WarishApplicationUpdateInput) {
  try {
    const updatedApplication = await db.warishApplication.update({
      where: { id: applicationId },
      data: {
        ...data,
      }
    }
    );

    return {
      success: true,
      data: updatedApplication,
    };
  } catch (error: any) {
    console.error("Error updating warish details:", error);
    return {
      success: false,
      message: error.message || "Failed to update warish details",
    };
  }
}

// Fetch warish applications by gpProfileId
export async function getWarishApplicationsByGpProfileId(gpProfileId: string) {
  try {
    const applications = await db.warishApplication.findMany({
      where: { gpProfileId: gpProfileId },
      include: {
        gpProfile: true,
      },
    });
    return {
      success: true,
      data: applications,
    };
  } catch (error: any) {
    console.error("Error fetching warish applications by gpProfileId:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch warish applications by gpProfileId",
    };
  }
}

// Create Warish Application with gpwise uniqueness check
export async function createWarishApplication(data: Prisma.WarishApplicationCreateInput) {
  try {
    // Check for existing application with the same acknowlegment and gpProfileId
    const existingApplication = await db.warishApplication.findFirst({
      where: {
        acknowlegment: data.acknowlegment,

      },
    });

    if (existingApplication) {
      return {
        success: false,
        message: "Acknowledgement number must be unique for this GP Profile.",
      };
    }

    const newApplication = await db.warishApplication.create({
      data: {
        ...data,
      },
    });

    return {
      success: true,
      data: newApplication,
    };
  } catch (error: any) {
    console.error("Error creating warish application:", error);
    return {
      success: false,
      message: error.message || "Failed to create warish application",
    };
  }
}
