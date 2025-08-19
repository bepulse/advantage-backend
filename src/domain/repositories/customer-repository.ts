import { Customer } from "@prisma/client"
import { IDatabaseRepository } from "./databaseRepository"

export interface ICustomerRepository extends IDatabaseRepository<Customer>{
}
