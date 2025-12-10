import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { Customer } from "@prisma/client";

export class SearchCustomersByNameUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly dependentRepository: IDependentRepository
  ) {}

  async execute(name: string): Promise<Customer[]> {
    const q = String(name || "").trim();
    if (!q) return [];

    const customersByName = await this.customerRepository.searchByName(q);
    const dependentsByName = await this.dependentRepository.searchByName(q);

    const dependentCustomerIds = Array.from(
      new Set(
        (dependentsByName || [])
          .map((d) => d.customerId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const customersFromDependents = await Promise.all(
      dependentCustomerIds.map((id) => this.customerRepository.findById(id))
    );

    const merged = new Map<string, Customer>();
    for (const c of customersByName) merged.set(c.id, c);
    for (const c of customersFromDependents) {
      if (c) merged.set(c.id, c);
    }

    return Array.from(merged.values());
  }
}
