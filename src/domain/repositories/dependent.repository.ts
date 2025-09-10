import { Dependent, Prisma } from "@prisma/client";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { IDatabaseRepository } from "./database.repository";

type DependentCreateInput = Omit<Dependent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export interface IDependentRepository extends IDatabaseRepository<Dependent> {
    delete(id: string): Promise<void>;
    save(data: DependentCreateInput, auditContext?: AuditContext): Promise<Dependent>;
    updateWhere(where: Prisma.DependentWhereInput, eligibility: boolean, auditContext?: AuditContext): Promise<Dependent>;
}
