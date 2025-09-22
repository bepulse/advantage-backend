export interface DocuSignWebhookPayload {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    envelopeId: string;
    envelopeSummary: {
      status: string;
      documentsUri: string;
      recipientsUri: string;
      attachmentsUri: string;
      envelopeUri: string;
      emailSubject: string;
      envelopeId: string;
      signingLocation: string;
      customFieldsUri: string;
      notificationUri: string;
      enableWetSign: string;
      allowMarkup: string;
      allowReassign: string;
      createdDateTime: string;
      lastModifiedDateTime: string;
      deliveredDateTime: string;
      sentDateTime: string;
      completedDateTime: string;
      voidedDateTime: string;
      voidedReason: string;
      deletedDateTime: string;
      declinedDateTime: string;
      statusChangedDateTime: string;
      documentsCombinedUri: string;
      certificateUri: string;
      templatesUri: string;
    };
  };
}