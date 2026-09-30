import { Injectable } from '@nestjs/common';
import { DeliveryResult, EmailMessage, EmailTransportAdapter } from './email-transport.interface.js';

@Injectable()
export class DisabledEmailTransportAdapter implements EmailTransportAdapter {
  async send(_message: EmailMessage): Promise<DeliveryResult> {
    return {
      success: false,
      failureCode: 'TRANSPORT_DISABLED',
      error: 'Email delivery is disabled or not configured',
      retryable: false,
    };
  }
}
