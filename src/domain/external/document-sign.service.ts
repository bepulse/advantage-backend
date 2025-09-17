export interface IDocumentSignService {
    createEnvelope(envelopeData: any): Promise<string>;
    getEnvelopeStatus(envelopeId: string): Promise<any>;
    downloadDocument(envelopeId: string, documentId: string): Promise<Buffer>;
}