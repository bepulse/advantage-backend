import { IDependentRepository } from "@/domain/repositories/dependent-repository";
import { Dependent } from "@prisma/client";

export class UpdateDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) {}

  async execute(data: Dependent): Promise<Dependent | null> {
    return await this.dependentRepository.update(data);
  }
}
