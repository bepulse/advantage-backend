import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Dependent } from "@prisma/client";

export class UpdateDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(data: Dependent, auditContext?: AuditContext): Promise<void> {
    await this.dependentRepository.update(data, auditContext);
  }
}
