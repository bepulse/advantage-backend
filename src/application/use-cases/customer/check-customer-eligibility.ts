import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IContractRepository } from "@/domain/repositories/contract.repository";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import { IDocumentRepository } from "@/domain/repositories/document.repository";
import NotFoundError from "@/shared/errors/not-found.error";

export interface CustomerEligibilityResponse {
    isEligible: boolean;
    pendencies: string[];
    details: {
        hasValidContract: boolean;
        contractStatus?: string;
        hasDependents: boolean;
        approvedDocuments: boolean;
        dependentsWithPendencies: Array<{
            dependentId: string;
            dependentName: string;
            missingDocuments: boolean;
            unapprovedDocuments: string[];
        }>;
    };
}

export class CheckCustomerEligibilityUseCase {
    constructor(
        private readonly customerRepository: ICustomerRepository,
        private readonly contractRepository: IContractRepository,
        private readonly dependentRepository: IDependentRepository,
        private readonly documentRepository: IDocumentRepository
    ) { }

    async execute(customerId: string): Promise<CustomerEligibilityResponse> {
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new NotFoundError('Cliente não encontrado');
        }

        const pendencies: string[] = [];
        let hasValidContract = false;
        let contractStatus: string | undefined;

        const contracts = await this.contractRepository.findByCustomerId(customerId);
        if (contracts.length === 0) {
            pendencies.push('Cliente não possui contrato');
        } else {
            const contract = contracts[0];
            contractStatus = contract.status;

            if (contract.status === 'completed' || contract.status === 'signed') {
                hasValidContract = true;
            } else {
                pendencies.push(`Contrato deve estar com status "completed" ou "signed". Status atual: ${contract.status}`);
            }
        }

        const dependents = await this.dependentRepository.findByCustomerId(customerId);
        const hasDependents = dependents.length > 0;
        
        const dependentsWithPendencies: Array<{
            dependentId: string;
            dependentName: string;
            missingDocuments: boolean;
            unapprovedDocuments: string[];
        }> = [];

        let approvedDocuments = true;

        for (const dependent of dependents) {
            const documents = await this.documentRepository.findByDependentId(dependent.id);

            const missingDocuments = documents.length === 0;
            const unapprovedDocuments: string[] = [];

            for (const document of documents) {
                if (!document.isApproved) {
                    unapprovedDocuments.push(`${document.kind} - ${document.fileName}`);
                }
            }

            if (missingDocuments || unapprovedDocuments.length > 0) {
                approvedDocuments = false;
                
                dependentsWithPendencies.push({
                    dependentId: dependent.id,
                    dependentName: dependent.name,
                    missingDocuments,
                    unapprovedDocuments
                });

                if (missingDocuments) {
                    pendencies.push(`Dependente ${dependent.name} não possui documentos`);
                }

                if (unapprovedDocuments.length > 0) {
                    pendencies.push(`Dependente ${dependent.name} possui documentos não aprovados: ${unapprovedDocuments.join(', ')}`);
                }
            }
        }

        const isEligible = hasValidContract && dependentsWithPendencies.length === 0;

        return {
            isEligible,
            pendencies,
            details: {
                hasValidContract,
                contractStatus,
                hasDependents,
                approvedDocuments,
                dependentsWithPendencies
            }
        };
    }
}