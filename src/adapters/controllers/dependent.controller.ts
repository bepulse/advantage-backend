import { CreateDependentUseCase } from "@/application/use-cases/dependent/create-dependent";
import { FindDependentByCustomerIdUseCase } from "@/application/use-cases/dependent/find-dependent-by-customerId";
import { UpdateDependentUseCase } from "@/application/use-cases/dependent/update-dependent";
import { UpdateDependentEligibilityUseCase } from "@/application/use-cases/dependent/update-dependent-eligibility";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class DependentController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createDependent: CreateDependentUseCase,
    private readonly findDependentByCustomerId: FindDependentByCustomerIdUseCase,
    private readonly updateDependentEligibility: UpdateDependentEligibilityUseCase,
    private readonly updateDependent: UpdateDependentUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/dependent", async ({ body }) => {
      await this.createDependent.execute(body);
    });

    this.httpServer.register(HttpMethod.GET, "/dependent/:customerId", async ({ params }) => {
      return await this.findDependentByCustomerId.execute(params.customerId);
    });

    this.httpServer.register(HttpMethod.PUT, "/dependent/eligible-dependent", async ({ body }) => {
      const { id, eligibility } = body;
      return await this.updateDependentEligibility.execute(id, eligibility);
    });

    this.httpServer.register(HttpMethod.PUT, "/dependent", async ({ body }) => {
      return await this.updateDependent.execute(body);
    });
  }
}
