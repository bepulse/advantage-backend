import { User } from "@prisma/client";
import { IDatabaseRepository } from "./database.repository";

export interface IUserRepository extends IDatabaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
}
