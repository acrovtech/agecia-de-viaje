'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireMasterRole, requireOperatorOrMaster } from '@/lib/auth-check';

const TransferInputSchema = z.object({
  title: z.string().min(2, 'El título es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  origin: z.string().min(2, 'El origen es requerido'),
  destination: z.string().min(2, 'El destino es requerido'),
  duration: z.string().default('20-30 min'),
  tripType: z.string().default('Solo ida'),
  description: z.string().default(''),
  bannerImage: z.string().default(''),
  hasSharedService: z.boolean().default(false),
  sharedPrice: z.number().nullable().optional(),
  hasPrivateService: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function createTransfer(formData: FormData) {
  const session = await requireOperatorOrMaster();

  const title = (formData.get('title') as string)?.trim() || '';
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase() || '';
  const origin = (formData.get('origin') as string)?.trim() || '';
  const destination = (formData.get('destination') as string)?.trim() || '';
  const duration = (formData.get('duration') as string)?.trim() || '20-30 min';
  const tripType = (formData.get('tripType') as string)?.trim() || 'Solo ida';
  const description = (formData.get('description') as string)?.trim() || '';
  const bannerImage = (formData.get('bannerImage') as string)?.trim() || '';

  const hasSharedService = formData.get('hasSharedService') === 'on' || formData.get('hasSharedService') === 'true';
  const sharedPriceRaw = formData.get('sharedPrice') as string;
  const sharedPrice = sharedPriceRaw ? parseFloat(sharedPriceRaw) : null;

  const hasPrivateService = formData.get('hasPrivateService') === 'on' || formData.get('hasPrivateService') === 'true';
  const orderRaw = formData.get('order') as string;
  const order = orderRaw ? parseInt(orderRaw, 10) : 0;

  const parsed = TransferInputSchema.safeParse({
    title,
    slug,
    origin,
    destination,
    duration,
    tripType,
    description,
    bannerImage,
    hasSharedService,
    sharedPrice,
    hasPrivateService,
    order,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos de traslado inválidos');
  }

  // Mapeo dinámico y robusto de vehículos de la base de datos
  const allDbVehicles = await prisma.vehicleType.findMany();
  const vehicleMap = new Map<string, string>();
  allDbVehicles.forEach((dbV) => {
    vehicleMap.set(dbV.id, dbV.id);
    vehicleMap.set(dbV.code, dbV.id);
  });

  const vehiclePricesToCreate: { vehicleId: string; price: number }[] = [];
  if (hasPrivateService) {
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('vehicle_price_')) {
        const keyId = key.replace('vehicle_price_', '').trim();
        const price = parseFloat(val as string);
        if (!isNaN(price) && price >= 0) {
          const realVehicleId = vehicleMap.get(keyId);
          if (realVehicleId && !vehiclePricesToCreate.some((vp) => vp.vehicleId === realVehicleId)) {
            vehiclePricesToCreate.push({
              vehicleId: realVehicleId,
              price,
            });
          }
        }
      }
    }
  }

  try {
    await prisma.transfer.create({
      data: {
        ...parsed.data,
        ...(session.agencyId ? { agencyId: session.agencyId } : {}),
        vehiclePrices: {
          create: vehiclePricesToCreate.map((vp) => ({
            vehicleId: vp.vehicleId,
            price: vp.price,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Error creando traslado:", error);
    throw new Error(handlePrismaError(error));
  }

  revalidatePath('/transporte');
  revalidatePath('/(dashboard)/transporte', 'page');
  redirect('/transporte');
}

export async function updateTransfer(formData: FormData) {
  await requireOperatorOrMaster();
  const id = formData.get('id') as string;
  if (!id) throw new Error('ID es requerido.');

  const title = (formData.get('title') as string)?.trim() || '';
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase() || '';
  const origin = (formData.get('origin') as string)?.trim() || '';
  const destination = (formData.get('destination') as string)?.trim() || '';
  const duration = (formData.get('duration') as string)?.trim() || '20-30 min';
  const tripType = (formData.get('tripType') as string)?.trim() || 'Solo ida';
  const description = (formData.get('description') as string)?.trim() || '';
  const bannerImage = (formData.get('bannerImage') as string)?.trim() || '';

  const hasSharedService = formData.get('hasSharedService') === 'on' || formData.get('hasSharedService') === 'true';
  const sharedPriceRaw = formData.get('sharedPrice') as string;
  const sharedPrice = sharedPriceRaw ? parseFloat(sharedPriceRaw) : null;

  const hasPrivateService = formData.get('hasPrivateService') === 'on' || formData.get('hasPrivateService') === 'true';
  const orderRaw = formData.get('order') as string;
  const order = orderRaw ? parseInt(orderRaw, 10) : 0;

  const parsed = TransferInputSchema.safeParse({
    title,
    slug,
    origin,
    destination,
    duration,
    tripType,
    description,
    bannerImage,
    hasSharedService,
    sharedPrice,
    hasPrivateService,
    order,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Datos de traslado inválidos');
  }

  // Mapeo dinámico y robusto de vehículos de la base de datos
  const allDbVehicles = await prisma.vehicleType.findMany();
  const vehicleMap = new Map<string, string>();
  allDbVehicles.forEach((dbV) => {
    vehicleMap.set(dbV.id, dbV.id);
    vehicleMap.set(dbV.code, dbV.id);
  });

  const vehiclePricesToCreate: { vehicleId: string; price: number }[] = [];
  if (hasPrivateService) {
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('vehicle_price_')) {
        const keyId = key.replace('vehicle_price_', '').trim();
        const price = parseFloat(val as string);
        if (!isNaN(price) && price >= 0) {
          const realVehicleId = vehicleMap.get(keyId);
          if (realVehicleId && !vehiclePricesToCreate.some((vp) => vp.vehicleId === realVehicleId)) {
            vehiclePricesToCreate.push({
              vehicleId: realVehicleId,
              price,
            });
          }
        }
      }
    }
  }

  try {
    // Transacción atómica: delete precios previos + update ruta
    await prisma.$transaction(async (tx) => {
      await tx.transferVehiclePrice.deleteMany({
        where: { transferId: id },
      });

      await tx.transfer.update({
        where: { id },
        data: {
          ...parsed.data,
          vehiclePrices: {
            create: vehiclePricesToCreate.map((vp) => ({
              vehicleId: vp.vehicleId,
              price: vp.price,
            })),
          },
        },
      });
    });
  } catch (error: any) {
    console.error("Error actualizando traslado:", error);
    throw new Error(handlePrismaError(error));
  }

  revalidatePath('/transporte');
  revalidatePath('/(dashboard)/transporte', 'page');
  redirect('/transporte');
}

export async function deleteTransfer(id: string) {
  if (!id) return { success: false, error: 'ID es requerido' };
  try {
    await requireMasterRole();
    await prisma.transfer.delete({
      where: { id },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true };
  } catch (error: any) {
    console.error("Error eliminando traslado:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function toggleTransferStatus(id: string, currentStatus: boolean) {
  try {
    await requireOperatorOrMaster();
    await prisma.transfer.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

const VehicleTypeInputSchema = z.object({
  code: z.string().min(2, 'El código del vehículo es requerido'),
  name: z.string().min(2, 'El nombre es requerido'),
  subtitle: z.string().optional(),
  maxPax: z.coerce.number().int().min(1, 'Capacidad mínima de 1 pasajero'),
  maxLuggage: z.coerce.number().int().min(0, 'Capacidad de equipaje inválida'),
  image: z.string().min(1, 'La imagen es requerida'),
  features: z.array(z.string()).default([]),
  order: z.coerce.number().int().default(0),
});

export async function createVehicleType(rawData: unknown) {
  try {
    await requireOperatorOrMaster();
    const parsed = VehicleTypeInputSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de vehículo inválidos' };
    }

    const data = parsed.data;
    const vehicle = await prisma.vehicleType.create({
      data: {
        code: data.code.trim().toLowerCase(),
        name: data.name.trim(),
        subtitle: data.subtitle?.trim() || null,
        maxPax: data.maxPax,
        maxLuggage: data.maxLuggage,
        image: data.image.trim(),
        features: data.features,
        order: data.order,
      },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true, vehicle };
  } catch (err: any) {
    return { success: false, error: handlePrismaError(err) };
  }
}

export async function updateVehicleType(id: string, rawData: unknown) {
  try {
    await requireOperatorOrMaster();
    if (!id) return { success: false, error: 'ID es requerido' };

    const parsed = VehicleTypeInputSchema.partial().safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de vehículo inválidos' };
    }

    const data = parsed.data;
    const vehicle = await prisma.vehicleType.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle?.trim() || null }),
        ...(data.maxPax !== undefined && { maxPax: data.maxPax }),
        ...(data.maxLuggage !== undefined && { maxLuggage: data.maxLuggage }),
        ...(data.image && { image: data.image.trim() }),
        ...(data.features && { features: data.features }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true, vehicle };
  } catch (err: any) {
    return { success: false, error: handlePrismaError(err) };
  }
}

export async function deleteVehicleType(id: string) {
  try {
    await requireMasterRole();
    if (!id) return { success: false, error: 'ID es requerido' };
    await prisma.vehicleType.delete({
      where: { id },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: handlePrismaError(err) };
  }
}
