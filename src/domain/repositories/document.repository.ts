import { Document, Prisma } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

export interface IDocumentRepository extends IDatabaseRepository<Document> {
  delete(id: string): Promise<void>;
  findByCustomerId(customerId: string): Promise<Document[]>;
  findByDependentId(dependentId: string): Promise<Document[]>;
  createDocument(data: Prisma.DocumentCreateInput): Promise<Document>;
}
