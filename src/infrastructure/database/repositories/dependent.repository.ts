import { IDependentRepository, DependentWithDocuments } from "@/domain/repositories/dependent.repository";
import { IDocumentRepository } from "@/domain/repositories/document.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Dependent, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";
import NotFoundError from "@/shared/errors/not-found.error";

type DependentCreateInput = Omit<Dependent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export class DependentRepository implements IDependentRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly documentRepository: IDocumentRepository
  ) { }

  async delete(id: string): Promise<void> {
    const dependent = await this.prisma.dependent.findUnique({
      where: { id }
    });

    if (!dependent) {
      throw new NotFoundError('Dependent not found');
    }

    await this.prisma.dependent.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Dependent | null> {
    return await this.prisma.dependent.findMany({
      where: { customerId: id },
    });
  }

  async findByCustomerId(customerId: string): Promise<Dependent[]> {
    return await this.prisma.dependent.findMany({
      where: { customerId },
    });
  }

  async findByIdWithDocuments(customerId: string): Promise<DependentWithDocuments[]> {
    const dependents = await this.prisma.dependent.findMany({
      where: { customerId },
    });

    const dependentsWithDocuments = await Promise.all(
      dependents.map(async (dependent: Dependent) => {
        const documents = await this.documentRepository.findByDependentId(dependent.id);
        return {
          ...dependent,
          documents
        };
      })
    );

    return dependentsWithDocuments;
  }

  async save(data: DependentCreateInput, auditContext?: AuditContext): Promise<Dependent> {
    const cleanDependentData: DependentCreateInput = {
      customerId: data.customerId,
      name: data.name,
      cpf: data.cpf,
      birthDate: data.birthDate,
      eligible: data.eligible ?? false,
      relationship: data.relationship
    };

    return await this.prisma.dependent.create({
      data: {
        ...cleanDependentData,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
      }
    });
  }

  async update(data: Dependent, auditContext?: AuditContext): Promise<Dependent> {
    const { id, createdAt, updatedAt, ...updateData } = data;
    return this.prisma.dependent.update({
      where: {
        id
      },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      },
    });
  }

  async updateWhere(
    where: Prisma.DependentWhereInput,
    eligibility: boolean,
    auditContext?: AuditContext
  ): Promise<Dependent> {
    return this.prisma.dependent.update({
      where,
      data: {
        eligible: eligibility,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      },
    });
  }
}
