import { ICustomerRepository } from "@/domain/repositories/customer-repository";

export class findCustomerByIdUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(id: string) {
    return await this.customerRepository.findById(id);
  }
}
