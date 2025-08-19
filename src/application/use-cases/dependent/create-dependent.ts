import { IDependentRepository } from "@/domain/repositories/dependent-repository";
import { Dependent } from "@prisma/client";

export class CreateDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) {}

  async execute(data: Dependent): Promise<void> {
    return await this.dependentRepository.save(data);
  }
}
