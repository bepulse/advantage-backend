import { Dependent, Prisma } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

type DependentCreateInput = Omit<Dependent, 'id' | 'createdAt' | 'updatedAt'>;

export interface IDependentRepository extends IDatabaseRepository<Dependent> {
    save(data: DependentCreateInput): Promise<Dependent>;
    updateWhere(where: Prisma.DependentWhereInput, eligibility: boolean): Promise<Dependent>;
}
