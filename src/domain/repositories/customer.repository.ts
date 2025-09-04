import { Customer } from "@prisma/client"
import { IDatabaseRepository } from "./database.repository"

export interface ICustomerRepository extends IDatabaseRepository<Customer>{
}
