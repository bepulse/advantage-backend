import { IContractRepository } from '@/domain/repositories/contract.repository';
import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { CreateEnvelopeAndSigningUrlRequest, CreateEnvelopeAndSigningUrlResponse } from '@/application/dto/create-envelope-and-signing-url.dto';
import { AuditContext } from '@/application/dto/audit-context.dto';

export class CreateEnvelopeAndGetSigningUrlUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly documentSignService: IDocumentSignService,
    private readonly customerRepository: ICustomerRepository
  ) { }

  async execute(request: CreateEnvelopeAndSigningUrlRequest, auditContext?: AuditContext): Promise<CreateEnvelopeAndSigningUrlResponse> {
    try {
      const customer = await this.customerRepository.findById(request.customerId);
      if (!customer) {
        throw new Error(`Cliente não encontrado. Id: ${request.customerId}`);
      }

      const envelopeDefinition = {
        templateId: '',
        templateRoles: [{
          email: request.recipientEmail,
          name: request.recipientName,
          roleName: 'customer'
        }],
        customerId: request.customerId,
        documentType: request.documentType
      };

      const envelopeId = await this.documentSignService.createEnvelope(envelopeDefinition);

      const contract = await this.contractRepository.save({
        customerId: request.customerId,
        envelopeId,
        status: 'sent',
        documentType: request.documentType
      }, auditContext);

      const signingUrl = await this.documentSignService.createRecipientView(
        envelopeId,
        request.recipientEmail,
        request.recipientName,
        request.returnUrl
      );

      return {
        envelopeId,
        signingUrl,
        contractId: contract.id
      };
    } catch (error) {
      throw new Error(`Erro ao criar envelope e URL de assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}