import { IContractRepository } from '@/domain/repositories/contract.repository';
import NotFoundError from '@/shared/errors/not-found.error';

export interface UpdateContractStatusRequest {
  envelopeId: string;
  status: string;
  updatedBy?: string;
}

export interface UpdateContractStatusResponse {
  success: boolean;
  contractId: string;
  newStatus: string;
}

export class UpdateContractStatusUseCase {
  constructor(
    private readonly contractRepository: IContractRepository
  ) {}

  async execute(request: UpdateContractStatusRequest): Promise<UpdateContractStatusResponse> {
    const { envelopeId, status, updatedBy } = request;

    const contracts = await this.contractRepository.findByEnvelopeId(envelopeId);
    if (contracts.length === 0) {
      throw new NotFoundError('Contrato não encontrado');
    }

    const contract = contracts[0];

    const updatedContract = {
      ...contract,
      status,
      updatedAt: new Date(),
      ...(updatedBy && { updatedBy })
    };

    await this.contractRepository.update(updatedContract);

    return {
      success: true,
      contractId: contract.id,
      newStatus: status
    };
  }
}