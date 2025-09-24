import { IDependentRepository, DependentWithDocuments } from "@/domain/repositories/dependent.repository";
import NotFoundError from "@/shared/errors/not-found.error";

export class FindDependentWithDocumentsByCustomerIdUseCase {
  constructor(private readonly dependentRepository: IDependentRepository) { }

  async execute(customerId: string): Promise<DependentWithDocuments[]> {
    const dependents = await this.dependentRepository.findByIdWithDocuments(customerId);

    if (!dependents || dependents.length === 0) {
      throw new NotFoundError('Dependents not found');
    }

    return dependents;
  }
}