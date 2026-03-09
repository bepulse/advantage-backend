import { IUserRepository } from "@/domain/repositories/user.repository";
import { CognitoUserService } from "@/infrastructure/external/cognito-user.service";
import HttpError from "@/shared/errors/http.error";
import { AdminUpdateUserPasswordRequest } from "@/application/dto/admin-update-user-password.dto";

export class AdminUpdateUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cognitoUserService: CognitoUserService
  ) {}

  async execute(request: AdminUpdateUserPasswordRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(request.email);
    
    if (!user) {
      throw new HttpError(404, "User not found in database");
    }

    try {
      await this.cognitoUserService.setUserPassword(request.email, request.password);
    } catch (error: any) {
      console.error("Error setting user password in Cognito:", error);
      throw new HttpError(500, "Failed to update user password in Cognito");
    }
  }
}
