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
        templateRoles: [{
          email: customer.email,
          name: customer.name,
          roleName: 'customer',
          clientUserId: customer.email
        }],
        customerId: customer.id,
        documentType: request.documentType
      };

      const existingContracts = await this.contractRepository.findByCustomerId(customer.id);
      const existingContract = existingContracts?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())?.[0];

      const { envelopeId, contractId } = existingContract
        ? {
          envelopeId: existingContract.envelopeId,
          contractId: existingContract.id
        }
        : await this.createNewContract(customer.id, envelopeDefinition, request.documentType, auditContext);

      const signingUrl = await this.documentSignService.createRecipientView(
        envelopeId,
        customer.email,
        customer.name,
        request.returnUrl
      );

      return {
        envelopeId,
        signingUrl,
        contractId
      };
    } catch (error) {
      throw new Error(`Erro ao criar envelope e URL de assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async createNewContract(
    customerId: string,
    envelopeDefinition: any,
    documentType: string,
    auditContext?: AuditContext
  ): Promise<{ envelopeId: string; contractId: string }> {
    const envelopeId = await this.documentSignService.createEnvelope(envelopeDefinition);

    const contract = await this.contractRepository.save({
      customerId,
      envelopeId,
      status: 'sent',
      documentType
    }, auditContext);

    return {
      envelopeId,
      contractId: contract.id
    };
  }
}