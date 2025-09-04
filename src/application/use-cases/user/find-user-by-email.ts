import { IUserRepository } from "@/domain/repositories/user.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { User } from "@prisma/client";

export class FindUserByEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(email: string): Promise<Omit<User, "passwordHash"> | null> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
