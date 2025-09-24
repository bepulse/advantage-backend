import { IDocumentRepository } from '@/domain/repositories/document.repository';
import { AWSS3Service } from '@/infrastructure/external/aws-s3.service';
import NotFoundError from '@/shared/errors/not-found.error';

export interface GetPresignedDownloadUrlRequest {
  documentId: string;
  expiresIn?: number; // Tempo de expiração em segundos (padrão: 1 hora)
  userId?: string; // Para auditoria
}

export interface GetPresignedDownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}

export class GetPresignedDownloadUrlUseCase {
  constructor(
    private documentRepository: IDocumentRepository,
    private awsS3Service: AWSS3Service
  ) {}

  async execute(request: GetPresignedDownloadUrlRequest): Promise<GetPresignedDownloadUrlResponse> {
    const { documentId, expiresIn = 3600 } = request; // 1 hora por padrão

    // Buscar o documento no banco de dados
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Extrair a chave S3 do filePath
    const s3Key = this.extractS3KeyFromPath(document.filePath);
    
    // Gerar URL pré-assinada para download
    const downloadUrl = await this.awsS3Service.getPresignedDownloadUrl(s3Key, expiresIn);

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      downloadUrl,
      filename: document.fileName,
      expiresAt
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