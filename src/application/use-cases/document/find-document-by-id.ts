import { DocumentRepository } from "@/infrastructure/database/repositories/document.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Document } from "@prisma/client";

export class FindDocumentByIdUseCase {
  constructor(private readonly documentRepository: DocumentRepository) { }
  async execute(id: string): Promise<Document | null> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return document;
  }
}
