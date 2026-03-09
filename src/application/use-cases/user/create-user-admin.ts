import { IUserRepository } from "@/domain/repositories/user.repository";
import { CognitoUserService } from "@/infrastructure/external/cognito-user.service";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { User, UserRole } from "@prisma/client";
import HttpError from "@/shared/errors/http.error";
import { CreateUserResponse } from "@/application/dto/create-user.dto";

export class CreateUserAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoUserService: CognitoUserService
  ) {}

  async execute(user: User, auditContext?: AuditContext): Promise<CreateUserResponse> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new HttpError(409, "User already exists");
    }

    try {
      await this.cognitoUserService.createUser(user.email);
    } catch (error: any) {
      console.error("Error creating user in Cognito:", error);
      throw new HttpError(500, "Failed to create user in Cognito");
    }

    if (!user.role) {
       user.role = UserRole.CUSTOMER;
    }

    const savedUser = await this.userRepository.save(user, auditContext);

    return {
      id: savedUser.id,
      role: savedUser.role,
      email: savedUser.email,
      customerId: savedUser.customerId,
    };
  }
}