import { IAddressRepository } from "@/domain/repositories/address.repository";
import { Address, PrismaClient } from "@prisma/client";

export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(customerId: string): Promise<Address | null> {
    return await this.prisma.address.findUnique({
      where: { customerId },
    });
  }

  async save(data: Address): Promise<Address> {
    return await this.prisma.address.create({ data });
  }

  async update(data: Address): Promise<Address> {
    return await this.prisma.address.update({
      where: {
        customerId: data.customerId,
      },
      data,
    });
  }

  async delete(customerId: string): Promise<void> {
    await this.prisma.address.delete({
      where: { customerId },
    });
  }
}
