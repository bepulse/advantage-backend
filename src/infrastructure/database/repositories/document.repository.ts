import { IDocumentRepository } from "@/domain/repositories/document.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
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

  async save(data: Document, auditContext?: AuditContext): Promise<Document> {
    return await this.prisma.document.create({ 
      data: {
        ...data,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
      }
    });
  }

  async update(data: Document, auditContext?: AuditContext): Promise<Document> {
    const { id, ...updateData } = data;
    return await this.prisma.document.update({
      where: { id },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      }
    });
  }
}
