import { Dependent, Prisma } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

export interface IDependentRepository extends IDatabaseRepository<Dependent> {
    updateWhere(where: Prisma.DependentWhereInput, eligibility: boolean): Promise<Dependent>;
}
