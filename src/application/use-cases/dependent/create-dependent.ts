import { CreateDependentResponse } from "@/application/dto/create-dependent.dto";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Dependent } from "@prisma/client";

export class CreateDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(dependent: Dependent, auditContext?: AuditContext): Promise<CreateDependentResponse> {
    const data = await this.dependentRepository.save(dependent, auditContext);

    return {
      id: data.id,
      customerId: data.customerId,
    }
  }
}
