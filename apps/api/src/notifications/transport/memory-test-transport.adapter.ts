import { Injectable } from '@nestjs/common';
import { DeliveryResult, EmailMessage, EmailTransportAdapter, FailureCode } from './email-transport.interface.js';

@Injectable()
export class MemoryTestEmailTransportAdapter implements EmailTransportAdapter {
  private messages: EmailMessage[] = [];
  private failNextCount = 0;
  private failCode: FailureCode = 'TEMPORARY_PROVIDER_FAILURE';
  private failRetryable = true;
  private failError = 'Simulated transport failure';

  async send(message: EmailMessage): Promise<DeliveryResult> {
    if (this.failNextCount > 0) {
      this.failNextCount--;
      return {
        success: false,
        failureCode: this.failCode,
        error: this.failError,
        retryable: this.failRetryable,
      };
    }

    this.messages.push(message);
    const providerMessageId = `test_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return {
      success: true,
      providerMessageId,
    };
  }

  getSentMessages(): readonly EmailMessage[] {
    return [...this.messages];
  }

  getLastMessage(): EmailMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  clear(): void {
    this.messages = [];
    this.failNextCount = 0;
  }

  failNext(
    count = 1,
    code: FailureCode = 'TEMPORARY_PROVIDER_FAILURE',
    retryable = true,
    error = 'Simulated transport failure',
  ): void {
    this.failNextCount = count;
    this.failCode = code;
    this.failRetryable = retryable;
    this.failError = error;
  }
}
