import { CreateRecipientViewRequest, CreateRecipientViewResponse } from '../../dto/recipient-view.dto';
import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { IDependentRepository } from '@/domain/repositories/dependent.repository';
import NotFoundError from '@/shared/errors/not-found.error';

export class CreateRecipientViewUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly dependentRepository: IDependentRepository
  ) {}

  async execute(request: CreateRecipientViewRequest): Promise<CreateRecipientViewResponse> {
    let { envelopeId, recipientEmail, recipientName, returnUrl } = request;

    const contracts = await this.contractRepository.findByEnvelopeId(envelopeId);
    if (contracts.length === 0) {
      throw new NotFoundError('Contrato não encontrado');
    }

    const contract = contracts[0];

    if (contract.status === 'completed') {
      throw new Error('Contrato já foi assinado');
    }

    if (contract.status === 'voided' || contract.status === 'declined') {
      throw new Error('Contrato não está disponível para assinatura');
    }

    if (contract.status === 'sent' || contract.status === 'delivered') {
      try {
        await this.documentSignService.voidEnvelope(envelopeId, 'Recriando envelope para visualização do destinatário');

        if (!contract.customerId) {
          throw new Error('Contrato sem cliente vinculado');
        }

        const customer = await this.customerRepository.findById(contract.customerId);
        if (!customer) {
          throw new Error('Cliente não encontrado');
        }

        const dependents = await this.dependentRepository.findByCustomerId(contract.customerId);

        const templateTabs = {
          textTabs: [
            {
              tabLabel: "Dependentes",
              value: `Titular: ${customer.name} - CPF: ${customer.cpf}\n\nDependentes:\n${
                dependents.length > 0
                  ? dependents.map((d) => `- ${d.name || ''} - CPF: ${d.cpf || ''}`).join("\n")
                  : ""
              }`,
              locked: "true",
              documentId: "1",
              pageNumber: "13",
              xPosition: "70",
              yPosition: "450",
            },
          ],
        };

        const envelopeDefinition = {
          templateRoles: [
            {
              email: customer.email,
              name: customer.name,
              roleName: "customer",
              clientUserId: customer.email,
              additionalNotifications: [
                {
                  secondaryDeliveryMethod: "SMS",
                  phoneNumber: { countryCode: "55", number: customer.phone || '' },
                },
              ],
              recipientId: "1",
              routingOrder: "1",
              tabs: (dependents.length > 0 && templateTabs) || null,
            },
          ],
          status: "sent",
          customerId: customer.id,
          documentType: contract.documentType,
        };

        const newEnvelopeId = await this.documentSignService.createEnvelope(envelopeDefinition);

        const updatedContract = {
          ...contract,
          envelopeId: newEnvelopeId,
          updatedAt: new Date()
        };

        await this.contractRepository.update(updatedContract);
        envelopeId = newEnvelopeId;
        recipientEmail = customer.email;
        recipientName = customer.name;

      } catch (error) {
        console.error('Erro ao recriar envelope:', error);
        throw error;
      }
    }

    const signingUrl = await this.documentSignService.createRecipientView(
      envelopeId,
      recipientEmail,
      recipientName,
      returnUrl
    );

    return {
      signingUrl,
      envelopeId,
      recipientEmail
    };
  }
}