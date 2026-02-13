import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Customer } from "@prisma/client";
import { CpfValidator } from "@/shared/utils/cpf.validator";
import BadRequestError from "@/shared/errors/bad-request.error";

export class UpdateCustomerUseCase {
    constructor(private readonly customerRepository: ICustomerRepository) { }

    async execute(customer: Customer, auditContext?: AuditContext): Promise<void> {
        if (customer.cpf && !CpfValidator.isValid(customer.cpf)) {
            throw new BadRequestError("CPF inválido");
        }
        await this.customerRepository.update(customer, auditContext);
    }
}
