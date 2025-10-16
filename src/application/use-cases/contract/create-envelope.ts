import { AuditContext } from "@/application/dto/audit-context.dto";
import { IContractRepository } from "@/domain/repositories/contract.repository";
import { IDocumentSignService } from "@/domain/external/document-sign.service";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import {
  CreateEnvelopeResponse,
  CreateEnvelopeRequest,
} from "@/application/dto/create-envelope.dto";

export class CreateEnvelopeUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly dependentRepository: IDependentRepository
  ) {}

  async execute(
    request: CreateEnvelopeRequest,
    auditContext?: AuditContext
  ): Promise<CreateEnvelopeResponse> {
    try {
      const customer = await this.customerRepository.findById(
        request.customerId
      );

      if (!customer) {
        throw new Error(`Cliente não encontrado. Id: ${request.customerId}`);
      }

      const hasDependents = await this.dependentRepository.findByCustomerId(
        request.customerId
      );

      const templateTabs = {
        textTabs: [
          {
            tabLabel: "Dependentes",
            value: `Dependentes:\n${
              hasDependents.length > 0 &&
              hasDependents.map((d) => `- ${d.name} - CPF: ${d.cpf}`).join("\n")
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
            additionalNotifications: [
              {
                secondaryDeliveryMethod: "SMS",
                phoneNumber: { countryCode: "55", number: customer.phone },
              },
            ],
            recipientId: "1",
            routingOrder: "1",
            tabs: (hasDependents.length > 0 && templateTabs) || null,
          },
        ],
        status: "sent",
        customerId: customer.id,
        documentType: request.documentType,
      };

      const existingContracts = await this.contractRepository.findByCustomerId(
        customer.id
      );
      const existingContract = existingContracts?.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )?.[0];

      const { envelopeId, contractId } = existingContract
        ? {
            envelopeId: existingContract.envelopeId,
            contractId: existingContract.id,
          }
        : await this.createNewContract(
            customer.id,
            envelopeDefinition,
            request.documentType,

            auditContext
          );
          const returnUrl = request.returnUrl;
      return {
        envelopeId,
        returnUrl,
        contractId,
      };
    } catch (error) {
      throw new Error(
        `Erro ao criar envelope e URL de assinatura: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  private async createNewContract(
    customerId: string,
    envelopeDefinition: any,
    documentType: string,
    auditContext?: AuditContext
  ): Promise<{ envelopeId: string; contractId: string }> {
    const envelopeId = await this.documentSignService.createEnvelope(
      envelopeDefinition
    );

    const docType = `${documentType}-operator`;

    const contract = await this.contractRepository.save(
      {
        customerId,
        envelopeId,
        status: "sent",
        documentType:docType,
      },
      auditContext
    );

    return {
      envelopeId,
      contractId: contract.id,
    };
  }
}
