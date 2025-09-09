import { CreateDocumentResponse } from "@/application/dto/create-document.dto";
import { DocumentRepository } from "@/infrastructure/database/repositories/document.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Document } from "@prisma/client";

export class CreateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) { }

  async execute(document: Document, auditContext?: AuditContext): Promise<CreateDocumentResponse> {
    const data = await this.documentRepository.save(document, auditContext);

    return {
      id: data.id,
      filePath: data.filePath,
    }
  }
}

