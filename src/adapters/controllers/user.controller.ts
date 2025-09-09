import { CreateUserUseCase } from "@/application/use-cases/user/create-user";
import { FindUserByEmailUseCase } from "@/application/use-cases/user/find-user-by-email";
import { FindUserByIdUseCase } from "@/application/use-cases/user/find-user-by-id";
import { UpdateUserUseCase } from "@/application/use-cases/user/update-user";
import { AuditContext } from "@/application/dto/audit-context.dto";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class UserController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserByEmail: FindUserByEmailUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/user", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.createUser.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.PUT, "/user", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.updateUser.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.GET, "/user", async ({ user, query }) => {
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
