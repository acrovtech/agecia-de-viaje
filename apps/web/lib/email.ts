import { Resend } from 'resend';

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
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .card-title { font-size: 16px; font-weight: 700; color: #062918; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; text-align: right; }
          .price-row { background: #062918; color: #ffffff; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 16px; font-weight: 700; display: flex; justify-content: space-between; }
          .price-row .value { color: #2dd4bf; }
          .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; background-color: #062918; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>INCA BOUND TOUR OPERATOR</h1>
            <p>¡Tu reserva ha sido confirmada con éxito!</p>
          </div>
          
          <div class="content">
            <div class="greeting">¡Hola, ${data.customerName}! 👋</div>
            <div class="message">
              Nos complace confirmarte que tu expedición a <strong>${data.tourTitle}</strong> está completamente reservada. A continuación te presentamos el resumen de tu reserva:
            </div>
            
            <div class="card">
              <div class="card-title">Detalles de la Reserva</div>
              
              <div class="row">
                <span class="label">Código de Reserva:</span>
                <span class="value">${data.reservationId.slice(-8).toUpperCase()}</span>
              </div>
              <div class="row">
                <span class="label">Tour:</span>
                <span class="value">${data.tourTitle}</span>
              </div>
              <div class="row">
                <span class="label">Fecha de Viaje:</span>
                <span class="value">${data.formattedDate}</span>
              </div>
              <div class="row">
                <span class="label">Pasajeros:</span>
                <span class="value">${data.pax} ${data.pax === 1 ? 'Pasajero' : 'Pasajeros'}</span>
              </div>
              ${data.pickupHotel ? `
              <div class="row">
                <span class="label">Hotel de Recojo:</span>
                <span class="value">${data.pickupHotel}</span>
              </div>` : ''}

              <div class="price-row">
                <span>Total Pagado:</span>
                <span class="value">$${data.totalPrice} USD</span>
              </div>
            </div>

            <div class="message" style="font-size: 13px; color: #64748b;">
              💡 <strong>Recomendaciones para tu viaje:</strong> Recuerda llevar tu documento de identidad o pasaporte original, ropa abrigadora en capas, protector solar y calzado cómodo con buena tracción.
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
      console.log(`📧 [MODO SIMULADO CORREO] Correo de confirmación generado para ${data.customerEmail} (Resend no configurado).`);
      return { success: true, simulated: true };
    }

    const response = await resend.emails.send({
      from: `Inca Bound <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `¡Reserva Confirmada! - ${data.tourTitle} | Inca Bound`,
      html: htmlContent,
    });

    console.log("✅ Correo de confirmación enviado exitosamente con Resend:", response);
    return { success: true, response };
  } catch (error: any) {
    console.error("❌ Error enviando correo de confirmación:", error);
    return { success: false, error: error.message };
  }
}
