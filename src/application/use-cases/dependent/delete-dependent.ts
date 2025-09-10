import { IDependentRepository } from "@/domain/repositories/dependent.repository";

export class DeleteDependentUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(id: string): Promise<void> {
    await this.dependentRepository.delete(id);
  }
}
