import { CreateEnvelopeRequest } from '../../dto/contract.dto';
import { AuditContext } from '@/application/dto/audit-context.dto';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import { IDocumentSignService } from '@/domain/external/document-sign.service';

export class CreateEnvelopeUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository
  ) { }

  async execute(request: CreateEnvelopeRequest, auditContext?: AuditContext): Promise<string> {
    const envelopeDefinition = this.buildEnvelopeDefinition(request);

    const envelopeId = await this.documentSignService.createEnvelope(envelopeDefinition);

    await this.contractRepository.save({
      customerId: request.customerId,
      envelopeId,
      status: 'sent',
      documentType: request.documentType
    }, auditContext);

    return envelopeId;
  }

  private buildEnvelopeDefinition(request: CreateEnvelopeRequest) {
    return {
      templateId: request.templateId,
      templateRoles: request.templateRoles || [],
      status: 'sent',
      emailSubject: `Contrato para assinatura - ${request.documentType}`
    };
  }
}