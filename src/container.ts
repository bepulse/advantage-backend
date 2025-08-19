import 'dotenv/config';
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { ExpressAdapter } from "./infrastructure/http/express.adapter";
import { PrismaClient } from '@prisma/client';
import { CustomerRepository } from './infrastructure/database/repositories/customer-repository';
import { CreateCustomerUseCase } from './application/use-cases/customer/create-customer';
import { CustomerController } from './adapters/controllers/customer.controller';
import { findCustomerByIdUseCase } from './application/use-cases/customer/find-customer-by-id';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({

    prisma: asValue(new PrismaClient()),
    httpServer: asClass(ExpressAdapter).singleton(),


    //Repositories
    customerRepository: asClass(CustomerRepository).singleton(),

    //UseCases
    createCustomer: asClass(CreateCustomerUseCase).singleton(),
    findCustomerById: asClass(findCustomerByIdUseCase).singleton(),
    
    //Controller
    customerController: asClass(CustomerController).singleton()
});

export default container;