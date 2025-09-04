import { CreateDependentResponse } from "@/application/dto/create-dependent.dto";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { Dependent } from "@prisma/client";

export class CreateDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(dependent: Dependent): Promise<CreateDependentResponse> {
    const data = await this.dependentRepository.save(dependent);

    return {
      id: data.id,
      customerId: data.customerId,
    }
  }
}
