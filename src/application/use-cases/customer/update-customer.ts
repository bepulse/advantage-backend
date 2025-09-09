import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Customer } from "@prisma/client";

export class UpdateCustomerUseCase {
    constructor(private readonly customerRepository: ICustomerRepository) { }

    async execute(customer: Customer, auditContext?: AuditContext): Promise<void> {
        await this.customerRepository.update(customer, auditContext);
    }
}
