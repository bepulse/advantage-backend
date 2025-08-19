import { IDependentRepository } from "@/domain/repositories/dependent-repository";

export class UpdateDependentEligibilityUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) {}

  async execute(id: string, eligibility: boolean): Promise<void> {
    await this.dependentRepository.updateWhere(
      {
        id,
      },
      eligibility
    );
  }
}
