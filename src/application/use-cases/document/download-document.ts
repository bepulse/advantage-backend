import { IDocumentRepository } from '@/domain/repositories/document.repository';
import { AWSS3Service } from '@/infrastructure/external/aws-s3.service';
import NotFoundError from '@/shared/errors/not-found.error';
import { Readable } from 'stream';

export interface DownloadDocumentRequest {
  documentId: string;
  userId?: string; // Para auditoria
}

export interface DownloadDocumentResponse {
  stream: Readable;
  filename: string;
  contentType?: string;
  contentLength?: number;
}

export class DownloadDocumentUseCase {
  constructor(
    private documentRepository: IDocumentRepository,
    private awsS3Service: AWSS3Service
  ) {}

  async execute(request: DownloadDocumentRequest): Promise<DownloadDocumentResponse> {
    const { documentId } = request;

    // Buscar o documento no banco de dados
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Extrair a chave S3 do filePath
    const s3Key = this.extractS3KeyFromPath(document.filePath);
    
    // Fazer download do arquivo do S3
    const downloadResult = await this.awsS3Service.downloadFile(s3Key);

    return {
      stream: downloadResult.stream,
      filename: document.fileName,
      contentType: downloadResult.contentType || document.mimeType || undefined,
      contentLength: downloadResult.contentLength
    };
  }

  private extractS3KeyFromPath(filePath: string): string {
    // Se o filePath for uma URL S3 (s3://bucket/key), extrair a chave
    if (filePath.startsWith('s3://')) {
      const parts = filePath.replace('s3://', '').split('/');
      return parts.slice(1).join('/'); // Remove o bucket name e retorna a chave
    }
    
    // Se for apenas a chave, retornar como está
    return filePath;
  }
}