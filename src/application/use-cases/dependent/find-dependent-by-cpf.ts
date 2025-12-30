import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Dependent } from "@prisma/client";

export class FindDependentByCpfUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(cpf: string): Promise<Dependent> {
    const dependent = await this.dependentRepository.findByCpf(cpf);

    if (!dependent) {
      throw new NotFoundError('Dependent not found');
    }

    return dependent;
  }
}
