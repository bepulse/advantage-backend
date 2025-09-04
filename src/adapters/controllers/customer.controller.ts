import { CreateCustomerUseCase } from "@/application/use-cases/customer/create-customer";
import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class CustomerController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly findCustomerById: FindCustomerByIdUseCase,
    private readonly createCustomer: CreateCustomerUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(
      "get",
      "/customer/:customerId",
      async (params, body) => {
        return await this.findCustomerById.execute(params.customerId);
      }
    );

    this.httpServer.register("post", "/customer", async (params, body) => {
      return await this.createCustomer.execute(body);
    });

    this.httpServer.register("put", "/customer", async (params, body) => {
      return await this.createCustomer.execute(body);
    });
  }
}
