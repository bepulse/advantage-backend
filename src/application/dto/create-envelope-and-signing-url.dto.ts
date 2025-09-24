export interface CreateEnvelopeAndSigningUrlRequest {
  customerId: string;
  documentType: string;
  recipientEmail: string;
  recipientName: string;
  returnUrl: string;
  createdBy?: string;
}

export interface CreateEnvelopeAndSigningUrlResponse {
  envelopeId: string;
  signingUrl: string;
  contractId: string;
}