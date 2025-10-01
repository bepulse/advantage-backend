import { CreateDependentResponse } from "@/application/dto/create-dependent.dto";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Dependent } from "@prisma/client";
import { IContractRepository } from "@/domain/repositories/contract.repository";

export class CreateDependentUseCase {
  constructor(
    private readonly dependentRepository: IDependentRepository,
    private readonly contractRepository: IContractRepository
  ) {}

  async execute(
    dependent: Dependent,
    auditContext?: AuditContext
  ): Promise<CreateDependentResponse> {
    if (dependent.cpf) {
      const existingDependent = await this.dependentRepository.findByCpf(
        dependent.cpf
      );

      if (existingDependent) {
        return {
          id: existingDependent.id,
          customerId: existingDependent.customerId,
        };
      }
    }

    const existingContracts = await this.contractRepository.findByCustomerId(
      dependent.customerId
    );

    if (existingContracts.length > 0) {
      const lastContract = existingContracts?.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )?.[0];
      await this.contractRepository.delete(lastContract.customerId!);
    }

    const data = await this.dependentRepository.save(dependent, auditContext);

    return {
      id: data.id,
      customerId: data.customerId,
    };
  }
}
