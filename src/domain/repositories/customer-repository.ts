import { Customer } from "@prisma/client"

export interface ICustomerRepository{
    save(data: Customer) : Promise<void>
    findById(id: string) : Promise<Customer | null>
}
