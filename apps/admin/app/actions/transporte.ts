'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminSession, requireMasterRole } from '@/lib/auth-check';

export async function createTransfer(formData: FormData) {
  await requireAdminSession();
  const title = (formData.get('title') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase();
  const origin = (formData.get('origin') as string)?.trim();
  const destination = (formData.get('destination') as string)?.trim();
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

  if (!title || !slug || !origin || !destination) {
    throw new Error('Título, slug, origen y destino son requeridos.');
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

  await prisma.transfer.create({
    data: {
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
      vehiclePrices: {
        create: vehiclePricesToCreate.map((vp) => ({
          vehicleId: vp.vehicleId,
          price: vp.price,
        })),
      },
    },
  });

  revalidatePath('/transporte');
  revalidatePath('/(dashboard)/transporte', 'page');
  redirect('/transporte');
}

export async function updateTransfer(formData: FormData) {
  await requireAdminSession();
  const id = formData.get('id') as string;
  if (!id) throw new Error('ID es requerido.');

  const title = (formData.get('title') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase();
  const origin = (formData.get('origin') as string)?.trim();
  const destination = (formData.get('destination') as string)?.trim();
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

  if (!title || !slug || !origin || !destination) {
    throw new Error('Título, slug, origen y destino son requeridos.');
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

  // Eliminar precios previos y actualizar ruta con los nuevos precios
  await prisma.transferVehiclePrice.deleteMany({
    where: { transferId: id },
  });

  await prisma.transfer.update({
    where: { id },
    data: {
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
      vehiclePrices: {
        create: vehiclePricesToCreate.map((vp) => ({
          vehicleId: vp.vehicleId,
          price: vp.price,
        })),
      },
    },
  });

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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleTransferStatus(id: string, currentStatus: boolean) {
  try {
    await requireAdminSession();
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

export async function createVehicleType(data: {
  code: string;
  name: string;
  subtitle?: string;
  maxPax: number;
  maxLuggage: number;
  image: string;
  features: string[];
  order?: number;
}) {
  try {
    await requireAdminSession();
    const vehicle = await prisma.vehicleType.create({
      data: {
        code: data.code.trim().toLowerCase(),
        name: data.name.trim(),
        subtitle: data.subtitle?.trim() || null,
        maxPax: data.maxPax,
        maxLuggage: data.maxLuggage,
        image: data.image.trim(),
        features: data.features,
        order: data.order || 0,
      },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true, vehicle };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateVehicleType(
  id: string,
  data: {
    name: string;
    subtitle?: string;
    maxPax: number;
    maxLuggage: number;
    image: string;
    features: string[];
    order?: number;
  }
) {
  try {
    await requireAdminSession();
    const vehicle = await prisma.vehicleType.update({
      where: { id },
      data: {
        name: data.name.trim(),
        subtitle: data.subtitle?.trim() || null,
        maxPax: data.maxPax,
        maxLuggage: data.maxLuggage,
        image: data.image.trim(),
        features: data.features,
        order: data.order || 0,
      },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true, vehicle };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteVehicleType(id: string) {
  try {
    await requireMasterRole();
    await prisma.vehicleType.delete({
      where: { id },
    });
    revalidatePath('/transporte');
    revalidatePath('/(dashboard)/transporte', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
