import { Customer } from "@prisma/client"
import { IDatabaseRepository } from "./database.repository"

export interface ICustomerRepository extends IDatabaseRepository<Customer> {
  findByCpfOrEmail(cpf: string, email: string): Promise<Customer | null>;
  searchByName(name: string): Promise<Customer[]>;
}
