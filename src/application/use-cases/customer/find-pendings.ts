import { IContractRepository } from "@/domain/repositories/contract.repository";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IDependentRepository } from "@/domain/repositories/dependent.repository";
import NotFoundError from "@/shared/errors/not-found.error";

export class FindPendingsUseCase {
    constructor(
        private readonly customerRepository: ICustomerRepository,
        private readonly contractRepository: IContractRepository,
        private readonly dependentRepository: IDependentRepository,
    ) { }

    async execute(id: string): Promise<any> {
        const customer = await this.customerRepository.findById(id);

        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        const contract = await this.contractRepository.findByCustomerId(id);

        if (!contract) {
            throw new NotFoundError('Contract not found');
        }

        const hasContractPending = contract.some(c => c.status !== 'completed');

        const dependents = await this.dependentRepository.findByCustomerId(id);

        const hasDependentPending = dependents.some(d => !d.eligible);

        return {
            hasContractPending,
            hasDependentPending,
            hasPendings: hasContractPending || hasDependentPending,
        };
    }
}
