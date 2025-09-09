import { IAddressRepository } from "@/domain/repositories/address.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Address, PrismaClient } from "@prisma/client";

export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(customerId: string): Promise<Address | null> {
    return await this.prisma.address.findUnique({
      where: { customerId },
    });
  }

  async save(data: Address, auditContext?: AuditContext): Promise<Address> {
    return await this.prisma.address.create({ 
      data: {
        ...data,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
      }
    });
  }

  async update(data: Address, auditContext?: AuditContext): Promise<Address> {
    const { createdAt, updatedAt, ...updateData } = data;
    return await this.prisma.address.update({
      where: {
        customerId: data.customerId,
      },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      },
    });
  }

  async delete(customerId: string): Promise<void> {
    await this.prisma.address.delete({
      where: { customerId },
    });
  }
}
