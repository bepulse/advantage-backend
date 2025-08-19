import { DocumentRepository } from "@/infrastructure/database/repositories/document-repository";
import { Document } from "@prisma/client";

export class CreateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}
  async execute(data: Document): Promise<void> {
    await this.documentRepository.save(data);
  }
  
}
