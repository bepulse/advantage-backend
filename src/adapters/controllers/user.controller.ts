import { CreateUserUseCase } from "@/application/use-cases/user/create-user";
import { FindUserByEmailUseCase } from "@/application/use-cases/user/find-user-by-email";
import { FindUserByIdUseCase } from "@/application/use-cases/user/find-user-by-id";
import { UpdateUserUseCase } from "@/application/use-cases/user/update-user";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class UserController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserByEmail: FindUserByEmailUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register("post", "/user", async ({ body }) => {
      return await this.createUser.execute(body);
    });

    this.httpServer.register("put", "/user", async ({ body }) => {
      return await this.updateUser.execute(body);
    });

    this.httpServer.register("get", "/user", async ({ user, query }) => {
      console.log(user)
      if (query.userId) {
        return await this.findUserById.execute(query.userId);
      }

      if (query.email) {
        return await this.findUserByEmail.execute(query.email);
      }

      throw new Error("Either userId or email query parameter is required");
    });
  }
}
