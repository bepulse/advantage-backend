import { CreateRecipientViewRequest, CreateRecipientViewResponse } from '../../dto/recipient-view.dto';
import { IDocumentSignService } from '@/domain/external/document-sign.service';
import { IContractRepository } from '@/domain/repositories/contract.repository';
import NotFoundError from '@/shared/errors/not-found.error';

export class CreateRecipientViewUseCase {
  constructor(
    private readonly documentSignService: IDocumentSignService,
    private readonly contractRepository: IContractRepository
  ) {}

  async execute(request: CreateRecipientViewRequest): Promise<CreateRecipientViewResponse> {
    const { envelopeId, recipientEmail, recipientName, returnUrl } = request;

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