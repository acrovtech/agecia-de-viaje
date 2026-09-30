export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: EmailAddress;
  replyTo?: string;
}

export type FailureCode =
  | 'TRANSPORT_DISABLED'
  | 'TEMPORARY_PROVIDER_FAILURE'
  | 'PERMANENT_RECIPIENT_FAILURE'
  | 'TEMPLATE_FAILURE'
  | 'DECRYPTION_FAILURE'
  | 'CONFIG_ERROR';

export interface DeliveryResult {
  success: boolean;
  providerMessageId?: string;
  failureCode?: FailureCode;
  error?: string;
  retryable?: boolean;
}

export const EMAIL_TRANSPORT_ADAPTER = Symbol('EMAIL_TRANSPORT_ADAPTER');

export interface EmailTransportAdapter {
  send(message: EmailMessage): Promise<DeliveryResult>;
}
