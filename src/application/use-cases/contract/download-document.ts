import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import NotFoundError from '@/shared/errors/not-found.error';

export interface DownloadDocumentRequest {
  envelopeId: string;
  documentId: string;
}

export interface DownloadDocumentResponse {
  document: Buffer;
  fileName: string;
  contentType: string;
}

export class DownloadDocumentUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly documentSignService: IDocumentSignService
  ) {}

  async execute(request: DownloadDocumentRequest): Promise<DownloadDocumentResponse> {
    const { envelopeId, documentId } = request;

    const contracts = await this.contractRepository.findByEnvelopeId(envelopeId);
    if (contracts.length === 0) {
      throw new NotFoundError('Contrato não encontrado');
    }

    const documentBuffer = await this.documentSignService.downloadDocument(envelopeId, documentId);

    const contract = contracts[0];
    const fileName = `${contract.documentType}_${envelopeId}_${documentId}.pdf`;

    return {
      document: documentBuffer,
      fileName,
      contentType: 'application/pdf'
    };
  }
}