import { Contract } from "@prisma/client"
import { IDatabaseRepository } from "./database.repository"
import { AuditContext } from "@/application/dto/audit-context.dto"

type ContractCreateInput = Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export interface IContractRepository extends IDatabaseRepository<Contract>{
  save(data: ContractCreateInput, auditContext?: AuditContext): Promise<Contract>;
  findByEnvelopeId(envelopeId: string): Promise<Contract[]>;
}
