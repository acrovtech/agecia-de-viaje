import { NotificationKind } from '@repo/db/prisma';

export function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface AgencyBranding {
  name: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
}

export function renderNotificationTemplate(
  kind: NotificationKind,
  payload: Record<string, any>,
  agency: AgencyBranding,
): RenderedEmail {
  const safeAgencyName = escapeHtml(agency.name);
  const logoHtml = agency.logoUrl
    ? `<div style="margin-bottom: 24px;"><img src="${escapeHtml(agency.logoUrl)}" alt="${safeAgencyName}" style="max-height: 48px; width: auto;" /></div>`
    : '';

  switch (kind) {
    case 'MEMBERSHIP_INVITATION': {
      const role = escapeHtml(payload.role || 'MEMBER');
      const invitationUrl = escapeHtml(payload.invitationUrl || '');
      const expiresAt = payload.expiresAt ? new Date(payload.expiresAt).toLocaleDateString() : '';

      const subject = `Invitación para unirte al equipo de ${agency.name}`;
      const text = [
        `Hola,`,
        ``,
        `Has sido invitado a formar parte del equipo de ${agency.name} con el rol de ${role}.`,
        ``,
        `Para aceptar la invitación y configurar tu acceso, ingresa al siguiente enlace:`,
        `${payload.invitationUrl}`,
        ``,
        expiresAt ? `Esta invitación expira el: ${expiresAt}.` : '',
        ``,
        `Si no esperabas esta invitación, puedes ignorar este mensaje.`,
        ``,
        `Atentamente,`,
        `${agency.name}`,
      ].filter(Boolean).join('\n');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;">
    ${logoHtml}
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Invitación de equipo</h2>
    <p>Has sido invitado a unirte al equipo de <strong>${safeAgencyName}</strong> con el rol de <strong>${role}</strong>.</p>
    <div style="margin: 28px 0;">
      <a href="${invitationUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Aceptar invitación</a>
    </div>
    <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:<br><span style="word-break: break-all; color: #0284c7;">${invitationUrl}</span></p>
    ${expiresAt ? `<p style="color: #64748b; font-size: 13px;">Esta invitación expira el <strong>${escapeHtml(expiresAt)}</strong>.</p>` : ''}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Si no esperabas esta invitación, puedes ignorar este correo de forma segura.</p>
  </div>
</body>
</html>`.trim();

      return { subject, text, html };
    }

    case 'RESERVATION_CREATED': {
      const code = escapeHtml(payload.reservationCode || payload.reservationId);
      const customer = escapeHtml(payload.customerName || 'Cliente');
      const serviceTitle = escapeHtml(payload.serviceTitle || 'Servicio turístico');
      const date = escapeHtml(payload.date || '');
      const pax = escapeHtml(payload.pax || 1);
      const hotel = payload.pickupHotel ? escapeHtml(payload.pickupHotel) : null;
      const time = payload.pickupTime ? escapeHtml(payload.pickupTime) : null;

      const subject = `Registro de reserva ${payload.reservationCode || payload.reservationId} - ${agency.name}`;
      const text = [
        `Hola ${payload.customerName || ''},`,
        ``,
        `Tu solicitud de reserva con ${agency.name} ha sido registrada.`,
        ``,
        `Código de reserva: ${payload.reservationCode || payload.reservationId}`,
        `Servicio: ${payload.serviceTitle}`,
        `Fecha de servicio: ${payload.date}`,
        `Pasajeros: ${payload.pax}`,
        hotel ? `Lugar de recojo: ${payload.pickupHotel}` : '',
        time ? `Hora de recojo: ${payload.pickupTime}` : '',
        ``,
        `Estado operativo: PENDIENTE`,
        `Nuestro equipo está coordinando los detalles operativos de tu experiencia.`,
        ``,
        `Atentamente,`,
        `${agency.name}`,
      ].filter(Boolean).join('\n');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;">
    ${logoHtml}
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Reserva registrada</h2>
    <p>Hola <strong>${customer}</strong>,</p>
    <p>Tu solicitud de reserva ha sido registrada en nuestro sistema con el código <strong>${code}</strong>.</p>
    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Servicio:</strong> ${serviceTitle}</p>
      <p style="margin: 4px 0;"><strong>Fecha:</strong> ${date}</p>
      <p style="margin: 4px 0;"><strong>Pasajeros:</strong> ${pax}</p>
      ${hotel ? `<p style="margin: 4px 0;"><strong>Recojo:</strong> ${hotel}</p>` : ''}
      ${time ? `<p style="margin: 4px 0;"><strong>Hora estimada:</strong> ${time}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Estado:</strong> <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">PENDIENTE</span></p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Nuestro equipo operativo validará los recursos y te informará oportunamente.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">${safeAgencyName}</p>
  </div>
</body>
</html>`.trim();

      return { subject, text, html };
    }

    case 'RESERVATION_CONFIRMED': {
      const code = escapeHtml(payload.reservationCode || payload.reservationId);
      const customer = escapeHtml(payload.customerName || 'Cliente');
      const serviceTitle = escapeHtml(payload.serviceTitle || 'Servicio turístico');
      const date = escapeHtml(payload.date || '');
      const note = payload.note ? escapeHtml(payload.note) : null;

      const subject = `Reserva CONFIRMADA ${payload.reservationCode || payload.reservationId} - ${agency.name}`;
      const text = [
        `Hola ${payload.customerName || ''},`,
        ``,
        `¡Buenas noticias! Tu reserva ${payload.reservationCode || payload.reservationId} ha sido confirmada por ${agency.name}.`,
        ``,
        `Servicio: ${payload.serviceTitle}`,
        `Fecha de servicio: ${payload.date}`,
        `Estado operativo: CONFIRMADA`,
        note ? `Nota operativa: ${payload.note}` : '',
        ``,
        `Atentamente,`,
        `${agency.name}`,
      ].filter(Boolean).join('\n');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;">
    ${logoHtml}
    <h2 style="margin-top: 0; color: #15803d; font-size: 20px;">Reserva Confirmada</h2>
    <p>Hola <strong>${customer}</strong>,</p>
    <p>Nos complace informarte que tu reserva <strong>${code}</strong> ha sido confirmada operativamente.</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Servicio:</strong> ${serviceTitle}</p>
      <p style="margin: 4px 0;"><strong>Fecha:</strong> ${date}</p>
      <p style="margin: 4px 0;"><strong>Estado:</strong> <span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">CONFIRMADA</span></p>
      ${note ? `<p style="margin: 8px 0 4px 0; color: #166534; font-size: 13px;"><strong>Detalle:</strong> ${note}</p>` : ''}
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">${safeAgencyName}</p>
  </div>
</body>
</html>`.trim();

      return { subject, text, html };
    }

    case 'RESERVATION_CANCELLED': {
      const code = escapeHtml(payload.reservationCode || payload.reservationId);
      const customer = escapeHtml(payload.customerName || 'Cliente');
      const serviceTitle = escapeHtml(payload.serviceTitle || 'Servicio turístico');
      const note = payload.note ? escapeHtml(payload.note) : null;

      const subject = `Reserva Cancelada ${payload.reservationCode || payload.reservationId} - ${agency.name}`;
      const text = [
        `Hola ${payload.customerName || ''},`,
        ``,
        `Te informamos que tu reserva ${payload.reservationCode || payload.reservationId} con ${agency.name} ha sido cancelada.`,
        ``,
        `Servicio: ${payload.serviceTitle}`,
        `Estado operativo: CANCELADA`,
        note ? `Motivo: ${payload.note}` : '',
        ``,
        `Atentamente,`,
        `${agency.name}`,
      ].filter(Boolean).join('\n');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;">
    ${logoHtml}
    <h2 style="margin-top: 0; color: #b91c1c; font-size: 20px;">Reserva Cancelada</h2>
    <p>Hola <strong>${customer}</strong>,</p>
    <p>Te informamos que tu reserva <strong>${code}</strong> ha sido cancelada.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Servicio:</strong> ${serviceTitle}</p>
      <p style="margin: 4px 0;"><strong>Estado:</strong> <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">CANCELADA</span></p>
      ${note ? `<p style="margin: 8px 0 4px 0; color: #991b1b; font-size: 13px;"><strong>Motivo:</strong> ${note}</p>` : ''}
    </div>
    <p style="color: #64748b; font-size: 14px;">Si tienes dudas sobre esta cancelación, por favor contáctanos.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">${safeAgencyName}</p>
  </div>
</body>
</html>`.trim();

      return { subject, text, html };
    }

    default:
      throw new Error(`TEMPLATE_FAILURE: Unknown notification kind: ${kind}`);
  }
}
