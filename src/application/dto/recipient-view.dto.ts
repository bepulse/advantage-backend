export interface CreateRecipientViewRequest {
  envelopeId: string;
  recipientEmail: string;
  recipientName: string;
  returnUrl: string;
}

export interface CreateRecipientViewResponse {
  signingUrl: string;
  envelopeId: string;
  recipientEmail: string;
}