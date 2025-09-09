import { CreateUserResponse } from "@/application/dto/create-user.dto";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { User } from "@prisma/client";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(user: User, auditContext?: AuditContext): Promise<CreateUserResponse> {
    console.log(JSON.stringify(user))
    const data = await this.userRepository.save(user, auditContext);

    return {
      id: data.id,
      role: data.role,
    }
  }
}
