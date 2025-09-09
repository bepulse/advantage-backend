import { IUserRepository } from "@/domain/repositories/user.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
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

  async save(data: User, auditContext?: AuditContext): Promise<User> {
    return await this.prisma.user.create({ 
      data: {
        ...data,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
      }
    });
  }

  async update(data: User, auditContext?: AuditContext): Promise<User> {
    const { id, createdAt, updatedAt, ...updateData } = data;
    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      },
    });
  }
}
