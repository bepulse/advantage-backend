import { DocumentRepository } from "@/infrastructure/database/repositories/document.repository";

export class DeleteDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}
  async execute(id: string): Promise<void> {
    await this.documentRepository.delete(id);
  }
}
