import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { Dependent, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";

type DependentCreateInput = Omit<Dependent, 'id' | 'createdAt' | 'updatedAt'>;

export class DependentRepository implements IDependentRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<Dependent | null> {
    return await this.prisma.dependent.findMany({
      where: { customerId: id },
    });
  }

  async save(data: DependentCreateInput): Promise<Dependent> {
    const cleanDependentData: DependentCreateInput = {
      customerId: data.customerId,
      name: data.name,
      cpf: data.cpf,
      birthDate: data.birthDate,
      eligible: data.eligible ?? false,
      relationship: data.relationship
    };

    return await this.prisma.dependent.create({
      data: cleanDependentData
    });
  }

  async update(data: Dependent): Promise<Dependent> {
    return this.prisma.dependent.update({
      where: {
        id: data.id
      },
      data,
    });
  }

  async updateWhere(
    where: Prisma.DependentWhereInput,
    eligibility: boolean
  ): Promise<Dependent> {
    return this.prisma.dependent.update({
      where,
      data: {
        eligible: eligibility,
      },
    });
  }
}
