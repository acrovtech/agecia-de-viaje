import { Resend } from 'resend';
import { logger } from './logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'reserva@incabound.com';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export type ReservationEmailData = {
  customerName: string;
  customerEmail: string;
  tourTitle: string;
  formattedDate: string;
  pax: number;
  totalPrice: number;
  pickupHotel?: string;
  reservationId: string;
};

/**
 * Envía un correo electrónico HTML de confirmación de reserva al cliente usando Resend.
 * Si las credenciales de Resend o GoDaddy/SMTP no están configuradas aún, opera con un fallback seguro.
 */
export async function sendReservationConfirmationEmail(data: ReservationEmailData) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reserva - Inca Bound</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f5; margin: 0; padding: 0; color: #1e293b; }
          .container { max-width: 600px; margin: 30px auto; background: #ffffff; rounded: 16px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background-color: #062918; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin-top: 8px; font-size: 14px; color: #2dd4bf; font-weight: 500; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .details-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px border-dashed #cbd5e1; font-size: 14px; }
          .details-row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 700; }
          .btn { display: inline-block; background-color: #062918; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; margin-top: 16px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inca Bound Operator</h1>
            <p>¡Reserva Confirmada Exitosamente!</p>
          </div>
          
          <div class="content">
            <div class="greeting">¡Hola, ${data.customerName}!</div>
            <div class="message">
              Hemos recibido la confirmación de tu pago de forma 100% segura. Tu expedición a <strong>${data.tourTitle}</strong> está completamente reservada.
            </div>

            <div class="details-card">
              <div class="details-row">
                <span class="label">Código de Reserva</span>
                <span class="value">#${data.reservationId.slice(-8).toUpperCase()}</span>
              </div>
              <div class="details-row">
                <span class="label">Tour Reservado</span>
                <span class="value">${data.tourTitle}</span>
              </div>
              <div class="details-row">
                <span class="label">Fecha del Tour</span>
                <span class="value">${data.formattedDate}</span>
              </div>
              <div class="details-row">
                <span class="label">Número de Pasajeros</span>
                <span class="value">${data.pax} ${data.pax === 1 ? 'Pasajero' : 'Pasajeros'}</span>
              </div>
              ${data.pickupHotel ? `
              <div class="details-row">
                <span class="label">Lugar de Recojo</span>
                <span class="value">${data.pickupHotel}</span>
              </div>
              ` : ''}
              <div class="details-row">
                <span class="label">Monto Total Pagado</span>
                <span class="value" style="color: #062918; font-size: 16px;">US$ ${data.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div class="message">
              Nuestro equipo de operaciones en Cusco se pondrá en contacto contigo 24 horas antes del tour para confirmar los detalles exactos del horario de recojo.
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://wa.me/51987654321?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20reserva%20${data.reservationId.slice(-8).toUpperCase()}" class="btn">
                📲 Contactar Soporte por WhatsApp
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Inca Bound Tour Operator - Cusco, Perú</p>
            <p>Este es un correo automático de confirmación. Para cualquier modificación contacta a nuestro equipo.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!resend) {
      logger('info', `Correo de confirmación simulado para ${data.customerEmail} (Resend no configurado).`);
      return { success: true, simulated: true };
    }

    const response = await resend.emails.send({
      from: `Inca Bound <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `¡Reserva Confirmada! - ${data.tourTitle} | Inca Bound`,
      html: htmlContent,
    });

    logger('info', 'Correo de confirmación enviado exitosamente con Resend:', response);
    return { success: true, response };
  } catch (error: any) {
    logger('error', 'Error enviando correo de confirmación:', error);
    return { success: false, error: error.message };
  }
}
