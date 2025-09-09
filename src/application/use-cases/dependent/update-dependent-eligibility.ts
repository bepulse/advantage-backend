import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";

export class UpdateDependentEligibilityUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(id: string, eligibility: boolean, auditContext?: AuditContext): Promise<void> {
    await this.dependentRepository.updateWhere(
      {
        id,
      },
      eligibility,
      auditContext
    );
  }
}
