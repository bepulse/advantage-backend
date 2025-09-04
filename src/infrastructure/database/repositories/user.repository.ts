import { IUserRepository } from "@/domain/repositories/user.repository";
import { PrismaClient, User } from "@prisma/client";

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async save(data: User): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async update(data: User): Promise<User> {
    return await this.prisma.user.update({
      where: {
        id: data.id,
      },
      data,
    });
  }
}
