import { IDocumentRepository } from '@/domain/repositories/document.repository';
import { AuditContext } from '@/application/dto/audit-context.dto';
import { Document } from '@prisma/client';
import NotFoundError from '@/shared/errors/not-found.error';

export interface UpdateDocumentApprovalRequest {
  documentId: string;
  isApproved: boolean;
}

export interface UpdateDocumentApprovalResponse {
  id: string;
  isApproved: boolean;
  updatedAt: Date;
}

export class UpdateDocumentApprovalUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(request: UpdateDocumentApprovalRequest, auditContext?: AuditContext): Promise<UpdateDocumentApprovalResponse> {
    const { documentId, isApproved } = request;

    const existingDocument = await this.documentRepository.findById(documentId);
    if (!existingDocument) {
      throw new NotFoundError(`Document with ID ${documentId} not found`);
    }

    const updatedDocumentData: Partial<Document> & { isApproved: boolean } = {
      ...existingDocument,
      isApproved,
      updatedAt: new Date(),
    };

    const updatedDocument = await this.documentRepository.update(updatedDocumentData as Document, auditContext);

    return {
      id: updatedDocument.id,
      isApproved: isApproved,
      updatedAt: updatedDocument.updatedAt,
    };
  }
}