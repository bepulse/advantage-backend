import { IUserRepository } from "@/domain/repositories/user.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { User } from "@prisma/client";

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(user: User, auditContext?: AuditContext): Promise<void> {
    await this.userRepository.update(user, auditContext);
  }
}
