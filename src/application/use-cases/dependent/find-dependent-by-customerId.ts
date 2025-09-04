import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Dependent } from "@prisma/client";

export class FindDependentByCustomerIdUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(id: string): Promise<Dependent | null> {
    const dependent = await this.dependentRepository.findById(id);

    if (!dependent) {
      throw new NotFoundError('Dependent not found');
    }

    return dependent;
  }
}
