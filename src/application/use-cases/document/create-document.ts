import { CreateDocumentResponse } from "@/application/dto/create-document.dto";
import { DocumentRepository } from "@/infrastructure/database/repositories/document.repository";
import { Document } from "@prisma/client";

export class CreateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) { }

  async execute(document: Document): Promise<CreateDocumentResponse> {
    const data = await this.documentRepository.save(document);

    return {
      id: data.id,
      filePath: data.filePath,
    }
  }
}

