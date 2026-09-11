'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAnyRole } from '@/lib/auth-check';

const RecordCampaignEmailSchema = z.object({
  customerEmail: z.string().email('Email de destinatario inválido'),
  campaignCode: z.string().min(1, 'El código de campaña es requerido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  flyerUrl: z.string().optional().nullable(),
  whatsappUrl: z.string().optional().nullable(),
});

/**
 * Registra el envío de un correo de marketing con flyer y código de atribución WhatsApp (ej: MK1).
 * Accesible para MASTER, MARKETING y CONTENT_CREATOR.
 */
export async function recordMarketingCampaignEmailAction(rawData: unknown) {
  try {
    const session = await requireAnyRole(['MASTER', 'MARKETING', 'CONTENT_CREATOR']);
    const parsed = RecordCampaignEmailSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del correo incompletos.' };
    }

    const d = parsed.data;
    const cleanCode = d.campaignCode.trim().toUpperCase();

    const logEntry = await (prisma as any).marketingCampaignLog.create({
      data: {
        customerEmail: d.customerEmail.trim().toLowerCase(),
        campaignCode: cleanCode,
        subject: d.subject.trim(),
        message: d.message.trim(),
        flyerUrl: d.flyerUrl?.trim() || null,
        whatsappUrl: d.whatsappUrl?.trim() || null,
        sentByEmail: session.email || 'marketing@agenciadeviajes.com',
      }
    });

    revalidatePath('/marketing');
    revalidatePath('/reservas');
    return { success: true, log: logEntry };
  } catch (error: any) {
    console.error('Error recording marketing campaign email:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Obtiene los logs de correos de marketing enviados a un cliente o globales.
 */
export async function getMarketingCampaignLogsAction(customerEmail?: string) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING', 'CONTENT_CREATOR']);

    const whereClause = customerEmail 
      ? { customerEmail: customerEmail.trim().toLowerCase() } 
      : {};

    const logs = await (prisma as any).marketingCampaignLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, logs };
  } catch (error: any) {
    console.error('Error fetching marketing campaign logs:', error);
    return { success: false, logs: [] };
  }
}
