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
    const customer: CustomerCreateInput = {
      name: customerRequest.name,
      cpf: customerRequest.cpf,
      email: customerRequest.email,
      phone: customerRequest.phone,
      birthDate: customerRequest.birthDate ? new Date(customerRequest.birthDate) : null
    };

    const existingCustomer = await this.customerRepository.findByCpfOrEmail(customer.cpf, customer.email);

    if (existingCustomer) {
      const updatedCustomer = await this.customerRepository.update({
        ...customer,
        id: existingCustomer.id,
        createdAt: existingCustomer.createdAt,
        updatedAt: existingCustomer.updatedAt,
        createdBy: existingCustomer.createdBy,
        updatedBy: existingCustomer.updatedBy
      } as Customer, auditContext);

      if (customerRequest.address) {
        const existingAddress = await this.addressRepository.findById(existingCustomer.id);

        const addressData: Address = {
          customerId: existingCustomer.id,
          type: customerRequest.address.type,
          street: customerRequest.address.street,
          number: customerRequest.address.number,
          district: customerRequest.address.district,
          complement: customerRequest.address.complement || null,
          city: customerRequest.address.city,
          state: customerRequest.address.state,
          country: customerRequest.address.country || 'BR',
          zipcode: customerRequest.address.zipcode,
          isDefault: customerRequest.address.isDefault ?? true,
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

      return {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        cpf: updatedCustomer.cpf,
        email: updatedCustomer.email
      };
    }

    const customerData: CustomerCreateInput & { address?: AddressCreateInput } = {
      ...customer
    };

    if (customerRequest.address) {
      customerData.address = {
        type: customerRequest.address.type,
        street: customerRequest.address.street,
        number: customerRequest.address.number,
        district: customerRequest.address.district,
        complement: customerRequest.address.complement || null,
        city: customerRequest.address.city,
        state: customerRequest.address.state,
        country: customerRequest.address.country || 'BR',
        zipcode: customerRequest.address.zipcode,
        isDefault: customerRequest.address.isDefault ?? true
      };
    }

    const savedCustomer = await (this.customerRepository as any).save(customerData, auditContext);

    return {
      id: savedCustomer.id,
      name: savedCustomer.name,
      cpf: savedCustomer.cpf,
      email: savedCustomer.email
    };
  }
}
