import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import { CreateDocumentUseCase } from "@/application/use-cases/document/create-document";
import { DeleteDocumentUseCase } from "@/application/use-cases/document/delete-document";
import { AuditContext } from "@/application/dto/audit-context.dto";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class DocumentController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createDocument: CreateDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly findDocumentById: FindCustomerByIdUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/document", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      await this.createDocument.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.GET, "/document/:id", async ({ params }) => {
      return await this.findDocumentById.execute(params.id);
    });

    this.httpServer.register(HttpMethod.DELETE, "/document/:id", async ({ params }) => {
      return await this.deleteDocument.execute(params.id);
    });
  }
}
