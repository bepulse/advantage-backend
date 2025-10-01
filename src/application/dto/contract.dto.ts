export interface CreateEnvelopeRequest {
  customerId: string;
  documentType: string;
  templateId?: string;
  templateRoles?: Array<{
    email?: string;
    name?: string;
    roleName?: string;
    tabs?: {
      textTabs?: Array<{
        tabLabel?: string;
        value?: string;
        locked?: boolean | string;
        documentId?: string;
        pageNumber?: string;
        xPosition?: string;
        yPosition?: string;
      }>;
      checkboxTabs?: Array<{
        tabLabel?: string;
        selected?: boolean | string;
        documentId?: string;
        pageNumber?: string;
        xPosition?: string;
        yPosition?: string;
      }>;
      noteTabs?: Array<{
        tabLabel?: string;
        value?: string;
        documentId?: string;
        pageNumber?: string;
        xPosition?: string;
        yPosition?: string;
      }>;
    };
  }>;
}