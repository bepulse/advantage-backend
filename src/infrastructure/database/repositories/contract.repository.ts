import { IContractRepository } from "@/domain/repositories/contract.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Contract, PrismaClient } from "@prisma/client";

type ContractCreateInput = Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export class ContractRepository implements IContractRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<Contract | null> {
    return await this.prisma.contract.findUnique({
      where: { id },
    });
  }

  async save(data: ContractCreateInput, auditContext?: AuditContext): Promise<Contract> {
    return await this.prisma.contract.create({
      data: {
        ...data,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
      }
    });
  }

  async update(data: Contract, auditContext?: AuditContext): Promise<Contract> {
    const { createdAt, updatedAt, ...updateData } = data;
    return await this.prisma.contract.update({
      where: {
        id: data.id,
      },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contract.delete({
      where: { id }
    });
  }

  async findByEnvelopeId(envelopeId: string): Promise<Contract[]> {
    return await this.prisma.contract.findMany({
      where: { envelopeId }
    });
  }

  async findByCustomerId(customerId: string): Promise<Contract[]> {
    return await this.prisma.contract.findMany({
      where: { customerId }
    });
  }
}
