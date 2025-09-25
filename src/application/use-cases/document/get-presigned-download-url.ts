import { IDocumentRepository } from '@/domain/repositories/document.repository';
import { AWSS3Service } from '@/infrastructure/external/aws-s3.service';
import NotFoundError from '@/shared/errors/not-found.error';

export interface GetPresignedDownloadUrlRequest {
  documentId: string;
  expiresIn?: number;
  userId?: string;
}

export interface GetPresignedDownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}

export class GetPresignedDownloadUrlUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly awsS3Service: AWSS3Service
  ) {}

  async execute(request: GetPresignedDownloadUrlRequest): Promise<GetPresignedDownloadUrlResponse> {
    const { documentId, expiresIn = 3600 } = request;

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    const s3Key = this.extractS3KeyFromPath(document.filePath);
    
    const downloadUrl = await this.awsS3Service.getPresignedDownloadUrl(s3Key, expiresIn);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      downloadUrl,
      filename: document.fileName,
      expiresAt
    };
  }

  private extractS3KeyFromPath(filePath: string): string {
    if (filePath.startsWith('s3://')) {
      const parts = filePath.replace('s3://', '').split('/');
      return parts.slice(1).join('/');
    }
    
    return filePath;
  }
}