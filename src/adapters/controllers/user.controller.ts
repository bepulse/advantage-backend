import { CreateCustomerUseCase } from "@/application/use-cases/customer/create-customer";
import { CreateUserUseCase } from "@/application/use-cases/user/create-user";
import { FindUserByIdUseCase } from "@/application/use-cases/user/find-user-by-id";
import { UpdateUserUseCase } from "@/application/use-cases/user/update-user";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class UserController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly findUserById: FindUserByIdUseCase
  ) {}

  registerRoutes() {
    this.httpServer.register("post", "/user", async (params, body) => {
      return await this.createUser.execute(body);
    });

    this.httpServer.register("put", "/user", async (params, body) => {
      return await this.updateUser.execute(body);
    });

    this.httpServer.register("get", "/user/:userId", async (params, body) => {
      return await this.findUserById.execute(params.userId);
    });
  }
}
