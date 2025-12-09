import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Customer } from "@prisma/client";

export class FindCustomerByCPFUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly dependentRepository: IDependentRepository
  ) {}

  async execute(cpf: string): Promise<Customer> {
    const customer = await this.customerRepository.findByCpfOrEmail(cpf, "");
    if (!customer) {
      const dependent = await this.dependentRepository.findByCpf(cpf);
      if (!dependent) {
        throw new NotFoundError("Customer not found");
      }

      const profile = await this.customerRepository.findById(dependent?.customerId);
      
      if (!profile) {
        throw new NotFoundError("Customer not found");
      }

      return profile;
    }

    return customer;
  }
}
