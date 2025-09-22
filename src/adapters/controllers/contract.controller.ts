import { CreateEnvelopeUseCase } from '../../application/use-cases/contract/create-envelope';
import { GetEnvelopeStatusUseCase } from '../../application/use-cases/contract/get-envelope-status';
import { DownloadDocumentUseCase } from '../../application/use-cases/contract/download-document';
import { UpdateContractStatusUseCase } from '../../application/use-cases/contract/update-contract-status';
import { AuditContext } from '@/application/dto/audit-context.dto';
import IHttpServer from '@/shared/interfaces/http/http-server';
import { HttpMethod } from '@/shared/types/http-method.enum';

export class ContractController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createEnvelope: CreateEnvelopeUseCase,
    private readonly getEnvelopeStatus: GetEnvelopeStatusUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
    private readonly updateContractStatus: UpdateContractStatusUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/webhook/docusign", async ({ body }) => {
      const auditContext: AuditContext = { userEmail: "webhook-contract@docusign.com" };
      return await this.createEnvelope.execute(body, auditContext);
    });

    // Criar envelope para assinatura
    this.httpServer.register(HttpMethod.POST, "/contract/envelope", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.createEnvelope.execute(body, auditContext);
    });

    // Obter status do envelope
    this.httpServer.register(HttpMethod.GET, "/contract/:envelopeId/status", async ({ params }) => {
      return await this.getEnvelopeStatus.execute({ envelopeId: params.envelopeId });
    });

    // Download do documento assinado
    this.httpServer.register(HttpMethod.GET, "/contract/:envelopeId/download", async ({ params, query, response }) => {
      const request = {
        envelopeId: params.envelopeId,
        documentId: query.documentId as string || '1'
      };
      const result = await this.downloadDocument.execute(request);

      response.setHeader('Content-Type', result.contentType);
      response.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      return result.document;
    });

    // Atualizar status do contrato
    this.httpServer.register(HttpMethod.PUT, "/contract/:envelopeId/status", async ({ params, body, user }) => {
      const request = {
        envelopeId: params.envelopeId,
        status: body.status,
        updatedBy: user?.email
      };
      return await this.updateContractStatus.execute(request);
    });
  }
}