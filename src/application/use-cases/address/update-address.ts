
import { IAddressRepository } from "@/domain/repositories/address.repository";
import { Address } from "@prisma/client";
import { AuditContext } from "@/application/dto/audit-context.dto";

export class UpdateAddressUseCase {
    constructor(private readonly addressRepository: IAddressRepository) { }

    async execute(address: Address, auditContext?: AuditContext): Promise<void> {
        await this.addressRepository.update(address, auditContext);
    }
}
