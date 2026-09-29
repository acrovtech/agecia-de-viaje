import { Injectable } from '@nestjs/common';

export interface SendInvitationParams {
  toEmail: string;
  agencyName: string;
  invitationRole: string;
  rawToken: string;
  expiresAt: Date;
}

export interface InvitationDeliveryResult {
  status: 'DELIVERY_NOT_CONFIGURED' | 'SENT' | 'FAILED';
  message: string;
}

export const INVITATION_DELIVERY_ADAPTER = Symbol('INVITATION_DELIVERY_ADAPTER');

export interface InvitationDeliveryAdapter {
  sendInvitation(params: SendInvitationParams): Promise<InvitationDeliveryResult>;
}

@Injectable()
export class DefaultInvitationDeliveryAdapter implements InvitationDeliveryAdapter {
  async sendInvitation(_params: SendInvitationParams): Promise<InvitationDeliveryResult> {
    // There is currently no reusable email provider configured in the central API.
    // Return explicit DELIVERY_NOT_CONFIGURED. Never fake successful email delivery.
    return {
      status: 'DELIVERY_NOT_CONFIGURED',
      message: 'Email delivery is not configured yet.',
    };
  }
}
