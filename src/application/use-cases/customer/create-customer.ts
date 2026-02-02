import { CreateCustomerResponse } from "@/application/dto/create-customer.dto";
import { CreateCustomerRequest } from "@/application/dto/create-customer-request.dto";
import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { IAddressRepository } from "@/domain/repositories/address.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Address, Customer } from "@prisma/client";

type CustomerCreateInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
type AddressCreateInput = Omit<Address, 'customerId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly addressRepository: IAddressRepository
  ) { }

  async execute(customerRequest: CreateCustomerRequest, auditContext?: AuditContext): Promise<CreateCustomerResponse> {
    const customerInput = this.mapCustomerInput(customerRequest);

    const [existingByCpf, existingByEmail] = await Promise.all([
      this.customerRepository.findByCpfOrEmail(customerInput.cpf, ""),
      this.customerRepository.findByCpfOrEmail("", customerInput.email)
    ]);

    if (existingByEmail && existingByEmail.cpf !== customerInput.cpf) {
      throw new Error("Email já utilizado.");
    }

    let resultCustomer: Customer;

    if (existingByCpf) {
      resultCustomer = await this.updateExistingCustomer(existingByCpf, customerInput, auditContext);
      
      if (customerRequest.address) {
        await this.updateCustomerAddress(existingByCpf.id, customerRequest.address, auditContext);
      }
    } else {
      resultCustomer = await this.createNewCustomer(customerInput, customerRequest.address, auditContext);
    }

    return {
      id: resultCustomer.id,
      name: resultCustomer.name,
      cpf: resultCustomer.cpf,
      email: resultCustomer.email
    };
  }

  private mapCustomerInput(request: CreateCustomerRequest): CustomerCreateInput {
    return {
      name: request.name,
      cpf: request.cpf,
      email: request.email,
      phone: request.phone,
      birthDate: request.birthDate ? new Date(request.birthDate) : null,
      comments: null,
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockedBy: null
    };
  }

  private async updateExistingCustomer(
    existingCustomer: Customer, 
    newData: CustomerCreateInput, 
    auditContext?: AuditContext
  ): Promise<Customer> {
    return this.customerRepository.update({
      ...newData,
      id: existingCustomer.id,
      // Preserva dados de controle/bloqueio originais
      isBlocked: existingCustomer.isBlocked,
      blockReason: existingCustomer.blockReason,
      blockedAt: existingCustomer.blockedAt,
      blockedBy: existingCustomer.blockedBy,
      createdAt: existingCustomer.createdAt,
      updatedAt: existingCustomer.updatedAt,
      createdBy: existingCustomer.createdBy,
      updatedBy: existingCustomer.updatedBy
    }, auditContext);
  }

  private async createNewCustomer(
    customerData: CustomerCreateInput, 
    addressRequest?: any, 
    auditContext?: AuditContext
  ): Promise<Customer> {
    const createData: CustomerCreateInput & { address?: AddressCreateInput } = {
      ...customerData
    };

    if (addressRequest) {
      createData.address = this.mapAddressInput(addressRequest);
    }

    return (this.customerRepository as any).save(createData, auditContext);
  }

  private async updateCustomerAddress(
    customerId: string, 
    addressRequest: any, 
    auditContext?: AuditContext
  ): Promise<void> {
    const existingAddress = await this.addressRepository.findById(customerId);
    
    const addressData: Address = {
      customerId,
      ...this.mapAddressInput(addressRequest),
      createdAt: existingAddress?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: existingAddress?.createdBy || auditContext?.userEmail || null,
      updatedBy: auditContext?.userEmail || null
    };

    if (existingAddress) {
      await this.addressRepository.update(addressData, auditContext);
    } else {
      await this.addressRepository.save(addressData, auditContext);
    }
  }

  private mapAddressInput(address: any): AddressCreateInput {
    return {
      type: address.type,
      street: address.street,
      number: address.number,
      district: address.district,
      complement: address.complement || null,
      city: address.city,
      state: address.state,
      country: address.country || 'BR',
      zipcode: address.zipcode,
      isDefault: address.isDefault ?? true
    };
  }
}
