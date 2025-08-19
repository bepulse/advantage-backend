import 'dotenv/config';
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { ExpressAdapter } from "./infrastructure/http/express.adapter";
import { PrismaClient } from '@prisma/client';
import { CustomerRepository } from './infrastructure/database/repositories/customer-repository';
import { CreateCustomerUseCase } from './application/use-cases/customer/create-customer';
import { CustomerController } from './adapters/controllers/customer.controller';
import { FindCustomerByIdUseCase } from './application/use-cases/customer/find-customer-by-id';
import { UserRepository } from './infrastructure/database/repositories/user-repository';
import { CreateUserUseCase } from './application/use-cases/user/create-user';
import { FindUserByIdUseCase } from './application/use-cases/user/find-user-by-id';
import { UpdateUserUseCase } from './application/use-cases/user/update-user';
import { UserController } from './adapters/controllers/user.controller';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({

    prisma: asValue(new PrismaClient()),
    httpServer: asClass(ExpressAdapter).singleton(),

    //Repositories
    customerRepository: asClass(CustomerRepository).singleton(),
    userRepository: asClass(UserRepository).singleton(),

    //UseCases
    createCustomer: asClass(CreateCustomerUseCase).singleton(),
    findCustomerById: asClass(FindCustomerByIdUseCase).singleton(),
    createUser: asClass(CreateUserUseCase).singleton(),
    findUserById:asClass(FindUserByIdUseCase).singleton(),
    updateUser: asClass(UpdateUserUseCase).singleton(),

    //Controller
    customerController: asClass(CustomerController).singleton(),
    userController: asClass(UserController).singleton(),
});

export default container;