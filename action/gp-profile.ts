'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// ─── Schemas ────────────────────────────────────────────────────────────────

const formSchema = z.object({
  gpname: z.string().min(2, "Name must be at least 2 characters"),
  gpaddress: z.string().min(5, "Address must be at least 5 characters"),
  nameinprodhan: z.string().min(2, "Prodhan name must be at least 2 characters"),
  gpcode: z.string().min(2, "GP code must be at least 2 characters"),
  gpnameinshort: z.string().min(2, "Short name must be at least 2 characters"),
  blockname: z.string().min(2, "Block name must be at least 2 characters"),
  gpshortname: z.string().min(2, "Short name must be at least 2 characters"),
  subscriptionStatus: z.enum(["ACTIVE", "DEACTIVE"]).default("ACTIVE"),
  staffLimit: z.number().int().min(1).default(10),
  menuControls: z.array(z.string()).default([]),
});

const gpAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  gpProfileId: z.string().min(1, "GP Profile is required"),
});

// ─── Save / Update GP Profile ────────────────────────────────────────────────

export async function saveGPProfile(data: z.infer<typeof formSchema>) {
  try {
    const role = await currentRole();
    if (role !== "superadmin") {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = formSchema.parse(data);

    const existingGp = await db.gPProfile.findFirst({
      where: { gpcode: validatedData.gpcode }
    });

    if (existingGp) {
      await db.gPProfile.update({
        where: { id: existingGp.id },
        data: validatedData
      });
      revalidatePath('/superadmindashboard/gp-management');
      return { success: true, message: 'GP Profile updated successfully!' };
    } else {
      const created = await db.gPProfile.create({ data: validatedData });
      revalidatePath('/superadmindashboard/gp-management');
      return { success: true, message: 'GP Profile created successfully!', id: created.id };
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, message: 'Database error: Failed to save GP Profile' };
  }
}

// ─── Update GP Profile by ID ─────────────────────────────────────────────────

export async function updateGPProfile(id: string, data: z.infer<typeof formSchema>) {
  try {
    const role = await currentRole();
    if (role !== "superadmin") return { success: false, message: "Unauthorized" };

    const validatedData = formSchema.parse(data);

    await db.gPProfile.update({ where: { id }, data: validatedData });
    revalidatePath('/superadmindashboard/gp-management');
    return { success: true, message: 'GP Profile updated successfully!' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({ path: err.path.join('.'), message: err.message }))
      };
    }
    return { success: false, message: 'Failed to update GP Profile' };
  }
}

// ─── Get All GP Profiles ──────────────────────────────────────────────────────

export async function getGPProfiles() {
  try {
    const role = await currentRole();
    if (role !== "superadmin") return { success: false, message: "Unauthorized", data: [] };

    const profiles = await db.gPProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true } }
      }
    });

    return { success: true, data: profiles };
  } catch {
    return { success: false, message: 'Failed to fetch GP Profiles', data: [] };
  }
}

// ─── Get Single GP Profile ────────────────────────────────────────────────────

export async function getGPProfileById(id: string) {
  try {
    const role = await currentRole();
    if (role !== "superadmin") return { success: false, message: "Unauthorized", data: null };

    const profile = await db.gPProfile.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'admin' },
          select: { id: true, name: true, email: true, mobileNumber: true, userStatus: true, emailVerified: true }
        }
      }
    });

    if (!profile) return { success: false, message: 'GP Profile not found', data: null };
    return { success: true, data: profile };
  } catch {
    return { success: false, message: 'Failed to fetch GP Profile', data: null };
  }
}

// ─── Toggle Subscription Status ───────────────────────────────────────────────

export async function toggleGPSubscriptionStatus(id: string) {
  try {
    const role = await currentRole();
    if (role !== "superadmin") return { success: false, message: "Unauthorized" };

    const existing = await db.gPProfile.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'GP Profile not found' };

    const newStatus = existing.subscriptionStatus === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';
    await db.gPProfile.update({ where: { id }, data: { subscriptionStatus: newStatus } });
    revalidatePath('/superadmindashboard/gp-management');
    return { success: true, message: `GP ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} successfully`, status: newStatus };
  } catch {
    return { success: false, message: 'Failed to toggle status' };
  }
}

// ─── Delete GP Profile ────────────────────────────────────────────────────────

export async function deleteGPProfile(id: string) {
  try {
    const role = await currentRole();
    if (role !== "superadmin") return { success: false, message: "Unauthorized" };

    await db.gPProfile.delete({ where: { id } });
    revalidatePath('/superadmindashboard/gp-management');
    return { success: true, message: 'GP Profile deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete GP Profile. It may have related data.' };
  }
}

// ─── Create GP Admin User ─────────────────────────────────────────────────────

export async function createGPAdminUser(data: z.infer<typeof gpAdminSchema>) {
  try {

    const validated = gpAdminSchema.parse(data);

    // Check GP profile exists
    const gpProfile = await db.gPProfile.findUnique({ where: { id: validated.gpProfileId } });
    if (!gpProfile) return { success: false, message: 'GP Profile not found' };

    // Block creation if GP subscription is inactive
    if (gpProfile.subscriptionStatus === 'DEACTIVE') {
      return { success: false, message: 'Cannot create admin: GP subscription is inactive' };
    }

    // Check email uniqueness
    const existingEmail = await db.user.findFirst({ where: { email: validated.email.toLowerCase() } });
    if (existingEmail) return { success: false, message: 'Email already in use' };

    // Check mobile uniqueness using findFirst (safer for nullable unique fields in MongoDB)
    const existingMobile = await db.user.findFirst({ where: { mobileNumber: validated.mobileNumber } });
    if (existingMobile) return { success: false, message: 'Mobile number already in use' };

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create admin user with auto-verified email so they can log in immediately
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        mobileNumber: validated.mobileNumber,
        password: hashedPassword,
        role: "admin",
        gpProfileId: validated.gpProfileId,
        emailVerified: new Date(),
        userStatus: 'active',
      },
      select: { id: true, name: true, email: true, role: true }
    });

    revalidatePath(`/superadmindashboard/gp-management/${validated.gpProfileId}/create-admin`);
    revalidatePath(`/superadmindashboard/gp-management/${validated.gpProfileId}`);
    revalidatePath('/superadmindashboard/gp-management');

    return {
      success: true,
      message: `Admin "${user.name}" created successfully for ${gpProfile.gpname}`,
      data: user
    };
  } catch (error) {
    console.error('[createGPAdminUser]', error);
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        message: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation failed',
      };
    }
    return { success: false, message: 'Server error: Failed to create GP Admin user' };
  }
}
