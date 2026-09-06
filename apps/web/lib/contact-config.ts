/**
 * Configuración oficial y centralizada de contacto de IncaBound
 */
export const CONTACT_CONFIG = {
  companyName: 'Inca Bound Travel Agency',
  whatsappNumber: '51984772299', // Número principal de reservas
  whatsappOperations: '51974681666', // Número de operaciones y asistencia 24/7
  displayPhone: '+51 984 772 299',
  email: 'reserva@incabound.com',
  address: 'Cusco, Perú',
  getWhatsappUrl(message: string = '', number: string = '51984772299') {
    const cleanNumber = number.replace(/\D/g, '');
    if (!message) return `https://api.whatsapp.com/send?phone=${cleanNumber}`;
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  }
};
