
import { IAddressRepository } from "@/domain/repositories/address.repository";
import { Address } from "@prisma/client";

export class UpdateAddressUseCase {
    constructor(private readonly addressRepository: IAddressRepository) { }

    async execute(address: Address): Promise<void> {
        await this.addressRepository.update(address);
    }
}
