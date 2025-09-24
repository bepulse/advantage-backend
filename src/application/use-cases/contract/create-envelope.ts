import { CreateEnvelopeRequest } from '../../dto/contract.dto';
import { AuditContext } from '@/application/dto/audit-context.dto';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';

export class CreateEnvelopeUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository,
    private readonly customerRepository: ICustomerRepository
  ) { }

  async execute(input: CreateEnvelopeRequest, auditContext?: AuditContext): Promise<string> {
    const envelopeDefinition = await this.buildEnvelopeDefinition(input);
    
    const envelopeId = await this.documentSignService.createEnvelope(envelopeDefinition);

    await this.contractRepository.save({
      customerId: input.customerId,
      envelopeId,
      status: 'sent',
      documentType: input.documentType
    }, auditContext);

    return envelopeId;
  }

  private async buildEnvelopeDefinition(input: CreateEnvelopeRequest) {
    if (!input.templateId) {
      throw new Error('Template ID is required');
    }

    if (!input.templateRoles || input.templateRoles.length === 0) {
      const customer = await this.customerRepository.findById(input.customerId);

      if (!customer) {
        throw new Error(`Cliente não encontrado. Id: ${input.customerId}`);
      }

      input.templateRoles = [{
        email: customer?.email,
        name: customer?.name,
        roleName: 'customer'
      }];
    }

    return {
      templateId: input.templateId,
      templateRoles: input.templateRoles || [],
      status: 'sent',
      emailSubject: `Contrato para assinatura - ${input.documentType}`
    };
  }
}