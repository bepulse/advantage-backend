import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import { AuditContext } from '@/application/dto/audit-context.dto';
import NotFoundError from '@/shared/errors/not-found.error';

export interface GetEnvelopeStatusRequest {
  envelopeId: string;
}

export interface GetEnvelopeStatusResponse {
  status: string;
  statusDateTime: string;
  emailSubject: string;
  envelopeId: string;
  recipients?: {
    signers: Array<{
      email: string;
      name: string;
      status: string;
      signedDateTime?: string;
    }>;
  };
}

export class GetEnvelopeStatusUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository
  ) {}

  async execute(request: GetEnvelopeStatusRequest): Promise<GetEnvelopeStatusResponse> {
    const { envelopeId } = request;

    const envelopeStatus = await this.documentSignService.getEnvelopeStatus(envelopeId);

    const contracts = await this.contractRepository.findByEnvelopeId(envelopeId);
    if (contracts.length > 0) {
      const contract = contracts[0];
      if (contract.status !== envelopeStatus.status) {
        const updatedContract = {
          ...contract,
          status: envelopeStatus.status,
          updatedAt: new Date()
        };
        await this.contractRepository.update(updatedContract);
      }
    }

    return {
      status: envelopeStatus.status,
      statusDateTime: envelopeStatus.statusDateTime,
      emailSubject: envelopeStatus.emailSubject,
      envelopeId: envelopeStatus.envelopeId,
      recipients: envelopeStatus.recipients
    };
  }
}