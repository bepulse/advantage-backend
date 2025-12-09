import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { Customer } from "@prisma/client";

export class SearchCustomersByNameUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(name: string): Promise<Customer[]> {
    const q = String(name || "").trim();
    if (!q) return [];
    return await this.customerRepository.searchByName(q);
  }
}

