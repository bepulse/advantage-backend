import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import NotFoundError from "@/shared/errors/not-found.error";
import { ToggleCustomerBlockStatusDto } from "@/application/dto/toggle-customer-block-status.dto";
import { AuditContext } from "@/application/dto/audit-context.dto";

export class ToggleCustomerBlockStatusUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) { }

  async execute(dto: ToggleCustomerBlockStatusDto, auditContext: AuditContext): Promise<void> {
    console.log(dto)
    const customer = await this.customerRepository.findById(dto.customerId);

    if (!customer) {
      throw new NotFoundError("Cliente não encontrado");
    }

    if (dto.isBlocked && !dto.blockReason) {
      throw new Error("O motivo de bloqueio é obrigatório quando o cliente é bloqueado");
    }

    let blockReason: string | null = null;
    let blockedAt: Date | null = null;
    let blockedBy = auditContext.userEmail ?? null;

    if (dto.isBlocked) {
      blockReason = dto.blockReason || null;
      blockedAt = new Date();
    }

    await this.customerRepository.updateBlockStatus(
      {
        id: dto.customerId,
        isBlocked: dto.isBlocked,
        blockReason,
        blockedAt,
        blockedBy,
      },
      auditContext
    );
  }
}

