import { IUserRepository } from "@/domain/repositories/user-repository";
import { User } from "@prisma/client";

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<User | null>{
    return await this.userRepository.findById(id);
  }
}
