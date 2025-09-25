import { IDocumentRepository } from '@/domain/repositories/document.repository';
import { AWSS3Service } from '@/infrastructure/external/aws-s3.service';
import { Document, DocumentKind, Prisma } from '@prisma/client';

export interface UploadDocumentRequest {
  customerId?: string;
  dependentId?: string;
  kind: DocumentKind;
  filename: string;
  mimetype: string;
  buffer: Buffer;
  uploadedBy: string;
}

export interface UploadDocumentResponse {
  document: Document;
  uploadUrl?: string;
}

export class UploadDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly awsS3Service: AWSS3Service
  ) {}

  async execute(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const { customerId, dependentId, kind, filename, mimetype, buffer, uploadedBy } = request;

    if (!customerId && !dependentId) {
      throw new Error('É necessário fornecer customerId ou dependentId');
    }

    const s3Key = this.awsS3Service.generateDocumentKey(
      customerId || '', 
      dependentId || null, 
      kind, 
      filename
    );
    
    const uploadResult = await this.awsS3Service.uploadFile(
      s3Key,
      buffer,
      mimetype,
      {
        originalFilename: filename,
        kind,
        customerId: customerId || '',
        dependentId: dependentId || '',
        uploadedBy
      }
    );

    const documentData: Prisma.DocumentCreateInput = {
      kind,
      fileName: filename,
      filePath: uploadResult.url,
      mimeType: mimetype,
      sizeBytes: BigInt(buffer.length),
      uploadedAt: new Date(),
      createdBy: uploadedBy,
      updatedBy: uploadedBy
    };

    if (customerId) {
      documentData.customer = { connect: { id: customerId } };
    }
    if (dependentId) {
      documentData.dependent = { connect: { id: dependentId } };
    }

    const document = await this.documentRepository.createDocument(documentData);

    return {
      document,
      uploadUrl: uploadResult.url
    };
  }
}