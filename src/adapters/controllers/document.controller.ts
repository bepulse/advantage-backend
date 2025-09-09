import { FindCustomerByIdUseCase } from "@/application/use-cases/customer/find-customer-by-id";
import { CreateDocumentUseCase } from "@/application/use-cases/document/create-document";
import { DeleteDocumentUseCase } from "@/application/use-cases/document/delete-document";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class DocumentController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createDocument: CreateDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly findDocumentById: FindCustomerByIdUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register("post", "/document", async ({ body }) => {
      await this.createDocument.execute(body);
    });

    this.httpServer.register("get", "/document/:id", async ({ params }) => {
      return await this.findDocumentById.execute(params.id);
    });

    this.httpServer.register("delete", "/document/:id", async ({ params }) => {
      return await this.deleteDocument.execute(params.id);
    });
  }
}
