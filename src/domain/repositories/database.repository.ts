import { AuditContext } from "@/application/dto/audit-context.dto";

export interface IDatabaseRepository<T> {
  findById(id: string): Promise<T | null>;
  save(data: T, auditContext?: AuditContext): Promise<T>;
  update(data: T, auditContext?: AuditContext): Promise<T>;
}
