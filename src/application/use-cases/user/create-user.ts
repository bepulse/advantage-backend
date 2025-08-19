import { IUserRepository } from "@/domain/repositories/user-repository";
import { User } from "@prisma/client";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: User): Promise<void> {
    await this.userRepository.save(data);
  }
}
