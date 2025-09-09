import { CreateCustomerResponse } from "@/application/dto/create-customer.dto";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Customer } from "@prisma/client";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(customer: Customer, auditContext?: AuditContext): Promise<CreateCustomerResponse> {
    const data = await this.customerRepository.save(customer, auditContext);

    return {
      id: data.id,
    }
  }
}
