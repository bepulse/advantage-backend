import { CreateCustomerUseCase } from "@/application/use-cases/customer/create-customer";
import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import { UpdateCustomerUseCase } from "@/application/use-cases/customer/update-customer";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class CustomerController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly findCustomerById: FindCustomerByIdUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.GET, "/customer/:customerId", async ({ params }) => {
      return await this.findCustomerById.execute(params.customerId);
    }
    );

    this.httpServer.register(HttpMethod.POST, "/customer", async ({ body }) => {
      return await this.createCustomer.execute(body);
    });

    this.httpServer.register(HttpMethod.PUT, "/customer", async ({ body }) => {
      return await this.updateCustomerUseCase.execute(body);
    });
  }
}
