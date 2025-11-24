import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Customer } from "@prisma/client";

export class FindCustomerByEmailUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findByCpfOrEmail("", email);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }
}
