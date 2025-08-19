import { ICustomerRepository } from "@/domain/repositories/customer-repository";
import { Customer } from "@prisma/client";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(customer: Customer): Promise<void> {
    await this.customerRepository.save(customer);
  }
}
