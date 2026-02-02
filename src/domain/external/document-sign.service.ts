export interface IDocumentSignService {
    createEnvelope(envelopeData: any): Promise<string>;
    getEnvelopeStatus(envelopeId: string): Promise<any>;
    downloadDocument(envelopeId: string, documentId: string): Promise<Buffer>;
    createRecipientView(envelopeId: string, recipientEmail: string, recipientName: string, returnUrl: string): Promise<string>;
    voidEnvelope(envelopeId: string, reason: string): Promise<void>;
}