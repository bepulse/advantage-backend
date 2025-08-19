import { IDependentRepository } from "@/domain/repositories/dependent-repository";
import { Dependent } from "@prisma/client";

export class FindDependentByCustomerIdUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) {}

  async execute(id: string): Promise<Dependent | null> {
    return await this.dependentRepository.findById(id);
  }
  
}
