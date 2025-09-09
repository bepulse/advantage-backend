import { CreateCustomerUseCase } from "@/application/use-cases/customer/create-customer";
import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import { UpdateCustomerUseCase } from "@/application/use-cases/customer/update-customer";
import { AuditContext } from "@/application/dto/audit-context.dto";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class CustomerController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly findCustomerById: FindCustomerByIdUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.GET, "/customer/:customerId", async ({ params }) => {
      return await this.findCustomerById.execute(params.customerId);
    }
    );

    this.httpServer.register(HttpMethod.POST, "/customer", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.createCustomer.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.PUT, "/customer", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.updateCustomer.execute(body, auditContext);
    });
  }
}
