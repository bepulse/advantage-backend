import { Dependent, Prisma, Document } from "@prisma/client";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { IDatabaseRepository } from "./database.repository";

type DependentCreateInput = Omit<Dependent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type DependentWithDocuments = Dependent & { documents: Document[] };

export interface IDependentRepository extends IDatabaseRepository<Dependent> {
    delete(id: string): Promise<void>;
    save(data: DependentCreateInput, auditContext?: AuditContext): Promise<Dependent>;
    updateWhere(where: Prisma.DependentWhereInput, eligibility: boolean, auditContext?: AuditContext): Promise<Dependent>;
    findByIdWithDocuments(customerId: string): Promise<DependentWithDocuments[]>;
    findByCustomerId(customerId: string): Promise<Dependent[]>;
    findByCpf(cpf: string): Promise<Dependent | null>;
    searchByName(name: string): Promise<Dependent[]>;
    updateDependentsEligibility(ids: string[], eligibility: boolean) : Promise<void>;
}
