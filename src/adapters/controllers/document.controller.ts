import { FindDocumentByIdUseCase } from "@/application/use-cases/document/find-document-by-id";
import { CreateDocumentUseCase } from "@/application/use-cases/document/create-document";
import { DeleteDocumentUseCase } from "@/application/use-cases/document/delete-document";
import { UploadDocumentUseCase } from "@/application/use-cases/document/upload-document";
import { DownloadDocumentUseCase } from "@/application/use-cases/document/download-document";
import { GetPresignedDownloadUrlUseCase } from "@/application/use-cases/document/get-presigned-download-url";
import { AuditContext } from "@/application/dto/audit-context.dto";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class DocumentController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createDocument: CreateDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly findDocumentById: FindDocumentByIdUseCase,
    private readonly uploadDocument: UploadDocumentUseCase,
    private readonly downloadDocumentFile: DownloadDocumentUseCase,
    private readonly getPresignedDownloadUrl: GetPresignedDownloadUrlUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/document", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      await this.createDocument.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.POST, "/document/upload", async ({ body, files, user }) => {
      const file = files?.document;

      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      const uploadRequest = {
        customerId: body.customerId,
        dependentId: body.dependentId,
        kind: body.kind,
        filename: file.originalname || file.name,
        mimetype: file.mimetype,
        buffer: file.buffer,
        uploadedBy: user?.email || 'unknown'
      };

      return await this.uploadDocument.execute(uploadRequest);
    });

    this.httpServer.register(HttpMethod.GET, "/document/:id/download", async ({ params, response }) => {
      const downloadResult = await this.downloadDocumentFile.execute({
        documentId: params.id
      });

      response.setHeader('Content-Type', downloadResult.contentType || 'application/octet-stream');
      response.setHeader('Content-Disposition', `attachment; filename="${downloadResult.filename}"`);

      if (downloadResult.contentLength) {
        response.setHeader('Content-Length', downloadResult.contentLength);
      }

      downloadResult.stream.pipe(response);
    });

    this.httpServer.register(HttpMethod.GET, "/document/:id/download-url", async ({ params, query, user }) => {
      return await this.getPresignedDownloadUrl.execute({
        documentId: params.id,
        expiresIn: query.expiresIn ? parseInt(query.expiresIn) : undefined,
        userId: user?.id
      });
    });

    this.httpServer.register(HttpMethod.GET, "/document/:id", async ({ params }) => {
      return await this.findDocumentById.execute(params.id);
    });

    this.httpServer.register(HttpMethod.DELETE, "/document/:id", async ({ params }) => {
      return await this.deleteDocument.execute(params.id);
    });
  }
}
