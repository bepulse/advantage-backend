import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { AuditContext } from "@/application/dto/audit-context.dto";
import { Address, Customer, PrismaClient } from "@prisma/client";

type CustomerCreateInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
type AddressCreateInput = Omit<Address, 'customerId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export class CustomerRepository implements ICustomerRepository {
  constructor(private prisma: PrismaClient) { }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        address: true
      }
    });

    if (!customer) return null;

    return customer;
  }

  async save(data: CustomerCreateInput & { address?: AddressCreateInput }, auditContext?: AuditContext): Promise<Customer> {
    const { address, ...customerData } = data;
  
    const cleanCustomerData: CustomerCreateInput = {
      name: customerData.name,
      cpf: customerData.cpf,
      email: customerData.email,
      phone: customerData.phone,
      birthDate: customerData.birthDate
    };

    const cleanAddressData: AddressCreateInput | undefined = address ? {
      type: address.type,
      street: address.street,
      number: address.number,
      complement: address.complement,
      district: address.district,
      city: address.city,
      state: address.state,
      zipcode: address.zipcode,
      country: address.country || 'BR',
      isDefault: address.isDefault ?? true
    } : undefined;

    return await this.prisma.customer.create({
      data: {
        ...cleanCustomerData,
        ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail }),
        address: cleanAddressData ? {
          create: {
            ...cleanAddressData,
            ...(auditContext?.userEmail && { createdBy: auditContext.userEmail, updatedBy: auditContext.userEmail })
          }
        } : undefined
      },
      include: {
        address: true
      }
    });
  }

  async update(data: Customer, auditContext?: AuditContext): Promise<Customer> {
    const { id, createdAt, updatedAt, ...updateData } = data;
    return await this.prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        ...(auditContext?.userEmail && { updatedBy: auditContext.userEmail })
      }
    });
  }
}
