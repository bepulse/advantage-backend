import { Address } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

export interface IAddressRepository extends IDatabaseRepository<Address> {
}
