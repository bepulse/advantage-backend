import { User } from "@prisma/client";
import { IDatabaseRepository } from "./databaseRepository";

export interface IUserRepository extends IDatabaseRepository<User>{
}
