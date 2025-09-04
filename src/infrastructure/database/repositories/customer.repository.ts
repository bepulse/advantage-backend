import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { Customer, PrismaClient } from "@prisma/client";

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) return null;

    return customer;
  }

  async save(data: Customer): Promise<Customer> {
    return await this.prisma.customer.create({ data });
  }

  async update(data: Customer): Promise<Customer> {
    return await this.prisma.customer.update({
      where: {
        id: data.id,
      },
      data,
    });
  }
}
