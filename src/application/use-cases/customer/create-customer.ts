import { CreateCustomerResponse } from "@/application/dto/create-customer.dto";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { Customer } from "@prisma/client";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(customer: Customer): Promise<CreateCustomerResponse> {
    const data = await this.customerRepository.save(customer);

    return {
      id: data.id,
    }
  }
}
