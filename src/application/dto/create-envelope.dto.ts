export interface CreateEnvelopeRequest {
  customerId: string;
  documentType: string;
  returnUrl?: string;
  createdBy?: string;
}

export interface CreateEnvelopeResponse {
  envelopeId: string;
  returnUrl?: string;
  contractId: string;
}
