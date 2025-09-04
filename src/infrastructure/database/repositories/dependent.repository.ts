import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { Dependent, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";

export class DependentRepository implements IDependentRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<Dependent | null> {
    return await this.prisma.dependent.findMany({
      where: { customerId: id },
    });
  }

  async save(data: Dependent): Promise<Dependent> {
    return await this.prisma.dependent.create({ data });
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
