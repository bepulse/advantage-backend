import { CreateEnvelopeUseCase } from '../../application/use-cases/contract/create-envelope';
import { GetEnvelopeStatusUseCase } from '../../application/use-cases/contract/get-envelope-status';
import { DownloadDocumentUseCase } from '../../application/use-cases/contract/download-document';
import { UpdateContractStatusUseCase } from '../../application/use-cases/contract/update-contract-status';
import { CreateRecipientViewUseCase } from '../../application/use-cases/contract/create-recipient-view';
import { CreateEnvelopeAndGetSigningUrlUseCase } from '../../application/use-cases/contract/create-envelope-and-signing-url';
import { AuditContext } from '@/application/dto/audit-context.dto';
import IHttpServer from '@/shared/interfaces/http/http-server';
import { HttpMethod } from '@/shared/types/http-method.enum';

export class ContractController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly createEnvelope: CreateEnvelopeUseCase,
    private readonly getEnvelopeStatus: GetEnvelopeStatusUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
    private readonly updateContractStatus: UpdateContractStatusUseCase,
    private readonly createRecipientView: CreateRecipientViewUseCase,
    private readonly createEnvelopeAndGetSigningUrl: CreateEnvelopeAndGetSigningUrlUseCase
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/contract/envelope", async ({ body, user }) => {
      const auditContext: AuditContext = { userEmail: user?.email };
      return await this.createEnvelope.execute(body, auditContext);
    });

    this.httpServer.register(HttpMethod.GET, "/contract/:envelopeId/status", async ({ params }) => {
      return await this.getEnvelopeStatus.execute({ envelopeId: params.envelopeId });
    });

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

    this.httpServer.register(HttpMethod.PUT, "/contract/:envelopeId/status", async ({ params, body, user }) => {
      const request = {
        envelopeId: params.envelopeId,
        status: body.status,
        updatedBy: user?.email
      };
      return await this.updateContractStatus.execute(request);
    });

    this.httpServer.register(HttpMethod.POST, "/contract/:envelopeId/signing-url", async ({ params, body }) => {
      const request = {
        envelopeId: params.envelopeId,
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
        returnUrl: body.returnUrl
      };
      return await this.createRecipientView.execute(request);
    });

    this.httpServer.register(HttpMethod.POST, "/contract/create-and-sign", async ({ body, user }) => {
      const request = {
        customerId: body.customerId,
        documentType: body.documentType,
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
        returnUrl: body.returnUrl
      };
      
      const auditContext = user ? { userEmail: user.email } : undefined;
      return await this.createEnvelopeAndGetSigningUrl.execute(request, auditContext);
    });
  }
}