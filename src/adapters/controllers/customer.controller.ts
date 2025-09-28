import { CreateCustomerUseCase } from "@/application/use-cases/customer/create-customer";
import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import { UpdateCustomerUseCase } from "@/application/use-cases/customer/update-customer";
import { AuditContext } from "@/application/dto/audit-context.dto";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";
import { FindPendingsUseCase } from "@/application/use-cases/customer/find-pendings";
import { FindCustomerByCPFUseCase } from "@/application/use-cases/customer/find-customer-by-cpf";

export class CustomerController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly findCustomerById: FindCustomerByIdUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly findPendings: FindPendingsUseCase,
    private readonly findCustomerByCPF: FindCustomerByCPFUseCase,
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.GET, "/customer-pendings/:customerId", async ({ params }) => {
      return await this.findPendings.execute(params.customerId);
    });

    this.httpServer.register(HttpMethod.GET, "/customer/cpf/:cpf", async ({ params }) => {
      return await this.findCustomerByCPF.execute(params.cpf);
    });

    this.httpServer.register(HttpMethod.GET, "/customer/:customerId", async ({ params }) => {
      return await this.findCustomerById.execute(params.customerId);
    });

    this.httpServer.register(HttpMethod.POST, "/customer", async ({ body, user }) => {
      console.log(body)
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.createCustomer.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.PUT, "/customer", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.updateCustomer.execute(body, auditContext);
    });
  }
}
