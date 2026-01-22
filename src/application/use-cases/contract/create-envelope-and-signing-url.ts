import { IContractRepository } from "@/domain/repositories/contract.repository";
import { IDocumentSignService } from "@/domain/external/document-sign.service";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import {
  CreateEnvelopeAndSigningUrlRequest,
  CreateEnvelopeAndSigningUrlResponse,
} from "@/application/dto/create-envelope-and-signing-url.dto";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import HttpError from "@/shared/errors/http.error";

export class CreateEnvelopeAndGetSigningUrlUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly documentSignService: IDocumentSignService,
    private readonly customerRepository: ICustomerRepository,
    private readonly dependentRepository: IDependentRepository
  ) {}

  async execute(
    request: CreateEnvelopeAndSigningUrlRequest,
    auditContext?: AuditContext
  ): Promise<CreateEnvelopeAndSigningUrlResponse> {
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
            value: `Titular: ${customer.name} - CPF: ${customer.cpf}\n\nDependentes:\n${
              hasDependents.length > 0
                ? hasDependents.map((d) => `- ${d.name} - CPF: ${d.cpf}`).join("\n")
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
            embeddedRecipientStartURL: "SIGN_AT_DOCUSIGN",
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

      const completedContract = existingContracts?.find(c => c.status === 'completed');
      if (completedContract) {
        throw new HttpError(409, "Contrato já assinado");
      }

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

      const signingUrl = await this.documentSignService.createRecipientView(
        envelopeId,
        customer.email,
        customer.name,
        request.returnUrl
      );

      return {
        envelopeId,
        signingUrl,
        contractId,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
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

    const contract = await this.contractRepository.save(
      {
        customerId,
        envelopeId,
        status: "sent",
        documentType,
        comments: null,
      },
      auditContext
    );

    return {
      envelopeId,
      contractId: contract.id,
    };
  }
}
