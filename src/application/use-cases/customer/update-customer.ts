import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { Customer } from "@prisma/client";

export class UpdateCustomerUseCase {
    constructor(private readonly customerRepository: ICustomerRepository) { }

    async execute(customer: Customer): Promise<void> {
        await this.customerRepository.update(customer);
    }
}
