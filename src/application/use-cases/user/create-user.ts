import { CreateUserResponse } from "@/application/dto/create-user.dto";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { User, UserRole } from "@prisma/client";
import HttpError from "@/shared/errors/http.error";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(user: User, auditContext?: AuditContext): Promise<CreateUserResponse> {
    if (user.role !== UserRole.CUSTOMER) {
      throw new HttpError(400, "Only users with CUSTOMER role can be created");
    }

    const data = await this.userRepository.save(user, auditContext);

    return {
      id: data.id,
      role: data.role,
      email: data.email,
      customerId: data.customerId,
    }
  }
}
