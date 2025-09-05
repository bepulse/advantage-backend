import { CreateUserResponse } from "@/application/dto/create-user.dto";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { User } from "@prisma/client";

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(user: User): Promise<CreateUserResponse> {
    console.log(JSON.stringify(user))
    const data = await this.userRepository.save(user);

    return {
      id: data.id,
      role: data.role,
    }
  }
}
