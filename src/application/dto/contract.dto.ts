export interface CreateEnvelopeRequest {
  customerId: string;
  documentType: string;
  templateId?: string;
  templateRoles?: Array<{
    email: string;
    name: string;
    roleName: string;
  }>;
}