import { CreateDependentUseCase } from "@/application/use-cases/dependent/create-dependent";
import { FindDependentByCustomerIdUseCase } from "@/application/use-cases/dependent/find-dependent-by-customerId";
import { UpdateDependentUseCase } from "@/application/use-cases/dependent/update-dependent";
import { UpdateDependentEligibilityUseCase } from "@/application/use-cases/dependent/update-dependent-eligibility";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class DependentController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createDependent: CreateDependentUseCase,
    private readonly findDependentByCustomerId: FindDependentByCustomerIdUseCase,
    private readonly updateDependentEligibility: UpdateDependentEligibilityUseCase,
    private readonly updateDependent: UpdateDependentUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(
      "post",
      "/dependent",
      async (params, body) => {
        await this.createDependent.execute(body);
      }
    );

    this.httpServer.register("get", "/dependent/:customerId", async ({ params }) => {
      return await this.findDependentByCustomerId.execute(params.customerId);
    });

    this.httpServer.register("put", "/dependent/eligible-dependent", async ({ body }) => {
      const { id, eligibility } = body;
      return await this.updateDependentEligibility.execute(id, eligibility);
    });

    this.httpServer.register("put", "/dependent", async ({ body }) => {
      return await this.updateDependent.execute(body);
    });
  }
}
