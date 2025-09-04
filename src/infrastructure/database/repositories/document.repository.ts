import { IDocumentRepository } from "@/domain/repositories/document.repository";
import { Document } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";

export class DocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return await this.prisma.document.findUnique({ where: { id } });
  }

  async save(data: Document): Promise<Document> {
    return await this.prisma.document.create({ data });
  }

  update(data: Document): Promise<Document> {
    throw new Error("Method not implemented.");
  }
}
