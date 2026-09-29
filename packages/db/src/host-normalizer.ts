import { domainToASCII } from 'node:url';

/**
 * Normaliza y valida de forma autoritativa un nombre de host HTTP según RFC 1035 / RFC 1123.
 *
 * Invariantes de seguridad:
 * - Convierte a minúsculas
 * - Elimina espacios en blanco alrededor
 * - Elimina el punto final de FQDN (trailing dot)
 * - Remueve el puerto de forma segura (ej. host:443 -> host, [::1]:8000 -> [::1])
 * - Rechaza caracteres de control (\x00-\x1F, \x7F)
 * - Rechaza espacios internos o comas (prevención de múltiples hosts / header injection)
 * - Rechaza esquemas (ej. https://, http://)
 * - Rechaza rutas (ej. domain.com/path)
 * - Rechaza userinfo (ej. user@domain.com)
 * - Valida longitud máxima de 253 caracteres y etiquetas de hasta 63 caracteres
 * - Convierte nombres internacionales a Punycode ASCII canónico
 *
 * Retorna el hostname canónico o null si es inválido.
 */
export function normalizeHost(rawHost: unknown): string | null {
  if (typeof rawHost !== 'string') {
    return null;
  }

  let host = rawHost.trim();
  if (!host || host.length === 0 || host.length > 253) {
    return null;
  }

  // 1. Rechazar caracteres de control
  if (/[\x00-\x1F\x7F]/.test(host)) {
    return null;
  }

  // 2. Rechazar espacios internos, comas (múltiples hosts en un header), barras o query/hash
  if (/[\s,/?#\\]/.test(host)) {
    return null;
  }

  // 3. Rechazar userinfo (ej. user@host)
  if (host.includes('@')) {
    return null;
  }

  // 4. Rechazar esquemas explícitos (ej. http:, https:)
  if (host.includes('://') || host.startsWith('http:') || host.startsWith('https:')) {
    return null;
  }

  // 5. Manejo seguro de puertos e IPv6
  if (host.startsWith('[')) {
    // IPv6 literal: [::1] o [::1]:8080
    const closeBracket = host.indexOf(']');
    if (closeBracket === -1) return null;
    const ipv6Part = host.slice(1, closeBracket);
    const afterBracket = host.slice(closeBracket + 1);
    if (afterBracket) {
      if (!/^:\d{1,5}$/.test(afterBracket)) return null;
      const port = Number(afterBracket.slice(1));
      if (port < 1 || port > 65535) return null;
    }
    // IPv6 normalizado
    return `[${ipv6Part.toLowerCase()}]`;
  }

  // IPv4 o dominio con posible puerto (ej. "example.com:3000" o "127.0.0.1:8080")
  const colonIndex = host.lastIndexOf(':');
  if (colonIndex !== -1) {
    const possiblePort = host.slice(colonIndex + 1);
    if (/^\d{1,5}$/.test(possiblePort)) {
      const port = Number(possiblePort);
      if (port >= 1 && port <= 65535) {
        host = host.slice(0, colonIndex);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // 6. Eliminar punto final de FQDN (trailing dot)
  if (host.endsWith('.')) {
    host = host.slice(0, -1);
  }

  if (!host || host.length === 0 || host.length > 253) {
    return null;
  }

  // 7. Normalizar a minúsculas
  host = host.toLowerCase();

  // 8. Caso especial localhost / IP loopback IPv4
  if (host === 'localhost' || host === '127.0.0.1') {
    return host;
  }

  // 9. Convertir a Punycode ASCII y validar
  try {
    const ascii = domainToASCII(host);
    if (!ascii || ascii.length === 0 || ascii.length > 253) {
      return null;
    }

    // Validar etiquetas de dominio
    const labels = ascii.split('.');
    for (const label of labels) {
      if (!label || label.length > 63) {
        return null;
      }
      // Etiquetas no deben empezar ni terminar con guion
      if (label.startsWith('-') || label.endsWith('-')) {
        return null;
      }
      // Solo caracteres permitidos en DNS: letras, dígitos, guion
      if (!/^[a-z0-9-]+$/.test(label)) {
        return null;
      }
    }

    return ascii;
  } catch {
    return null;
  }
}
