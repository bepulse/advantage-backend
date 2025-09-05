import { IUserRepository } from "@/domain/repositories/user.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { User } from "@prisma/client";

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
