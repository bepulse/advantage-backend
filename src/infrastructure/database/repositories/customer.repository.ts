import { ICustomerRepository } from "@/domain/repositories/customer.repository";
import { Address, Customer, PrismaClient } from "@prisma/client";

type CustomerCreateInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
type AddressCreateInput = Omit<Address, 'customerId' | 'createdAt' | 'updatedAt'>;

export class CustomerRepository implements ICustomerRepository {
  constructor(private prisma: PrismaClient) {}

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

  async save(data: CustomerCreateInput & { address?: AddressCreateInput }): Promise<Customer> {
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
        address: cleanAddressData ? {
          create: cleanAddressData
        } : undefined
      },
      include: {
        address: true
      }
    });
  }

  async update(data: Customer): Promise<Customer> {
    return await this.prisma.customer.update({
      where: { id: data.id },
      data
    });
  }
}
