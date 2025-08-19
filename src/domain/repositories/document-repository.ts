import { Document } from "@prisma/client";
import { IDatabaseRepository } from "./databaseRepository";

export interface IDocumentRepository extends IDatabaseRepository<Document> {
  delete(id: string): Promise<void>;
}
