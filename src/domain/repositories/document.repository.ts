import { Document } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

export interface IDocumentRepository extends IDatabaseRepository<Document> {
  delete(id: string): Promise<void>;
}
