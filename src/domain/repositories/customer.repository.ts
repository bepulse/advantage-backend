import { Customer } from "@prisma/client"
import { IDatabaseRepository } from "./database.repository"
import { AuditContext } from "@/application/dto/audit-context.dto";

export interface ICustomerRepository extends IDatabaseRepository<Customer> {
  findByCpfOrEmail(cpf: string, email: string): Promise<Customer | null>;
  searchByName(name: string): Promise<Customer[]>;
  updateBlockStatus(data: Pick<Customer, 'id' | 'isBlocked' | 'blockReason' | 'blockedAt' | 'blockedBy'>, auditContext?: AuditContext): Promise<void>;
}
