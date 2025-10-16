import { UpdateContractStatusUseCase } from '@/application/use-cases/contract/update-contract-status';
import { DocuSignWebhookPayload } from '@/application/dto/docusign-webhook.dto';
import IHttpServer from '@/shared/interfaces/http/http-server';
import { HttpMethod } from '@/shared/types/http-method.enum';

export class WebhookController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly updateContractStatus: UpdateContractStatusUseCase
  ) {}

  registerRoutes() {
    this.httpServer.register(HttpMethod.POST, "/webhook/docusign", async ({ body }) => {
      try {
        const payload = body as DocuSignWebhookPayload;
        
        if (payload.event === 'envelope-completed' || 
            payload.event === 'envelope-declined' || 
            payload.event === 'envelope-voided' ||
            payload.event === 'envelope-sent') {
          
          const envelopeId = payload.data.envelopeId;
          const newStatus = payload.data.envelopeSummary.status;
          
          await this.updateContractStatus.execute({
            envelopeId,
            status: newStatus,
            updatedBy: 'system@docusign.webhook'
          });
          
          console.log(`Contract with envelope ${envelopeId} status updated to ${newStatus} via DocuSign webhook`);
        }
        
        return { success: true, message: 'Webhook processed successfully' };
      } catch (error) {
        console.error('Error processing DocuSign webhook:', error);
        throw { success: false, message: 'Error processing webhook' };
      }
    });
  }
}