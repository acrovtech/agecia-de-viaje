import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const requestId = response.getHeader('X-Request-Id');
    if (status >= 500) {
      // Prisma/provider exceptions may contain credentials, SQL and personal data.
      this.logger.error(JSON.stringify({ requestId, status, event: 'request_failed' }));
    }
    const codes: Record<number, string> = {
      400: 'INVALID_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN',
      404: 'NOT_FOUND', 409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 429: 'RATE_LIMITED', 503: 'UNAVAILABLE',
    };
    response.status(status).json({
      error: {
        code: codes[status] ?? 'INTERNAL_ERROR',
        message: status >= 500 ? 'Servicio no disponible temporalmente.' : 'La solicitud no pudo procesarse.',
        requestId,
      },
    });
  }
}
