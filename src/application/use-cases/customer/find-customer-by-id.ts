import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Customer } from "@prisma/client";

export class FindCustomerByIdUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }
}
