import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { Customer } from "@prisma/client";

export class FindCustomerByCPFUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(cpf: string): Promise<Customer> {
    const customer = await this.customerRepository.findByCpfOrEmail(cpf, '');

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }
}
