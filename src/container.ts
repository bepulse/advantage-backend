import 'dotenv/config';
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { ExpressAdapter } from "./infrastructure/http/express.adapter";
import { PrismaClient } from '@prisma/client';
import { CustomerRepository } from './infrastructure/database/repositories/customer.repository';
import { CreateCustomerUseCase } from './application/use-cases/customer/create-customer';
import { CustomerController } from './adapters/controllers/customer.controller';
import { FindCustomerByIdUseCase } from './application/use-cases/customer/find-customer-by-id';
import { UserRepository } from './infrastructure/database/repositories/user.repository';
import { CreateUserUseCase } from './application/use-cases/user/create-user';
import { FindUserByIdUseCase } from './application/use-cases/user/find-user-by-id';
import { UpdateUserUseCase } from './application/use-cases/user/update-user';
import { UserController } from './adapters/controllers/user.controller';
import { DependentRepository } from './infrastructure/database/repositories/dependent.repository';
import { CreateDependentUseCase } from './application/use-cases/dependent/create-dependent';
import { FindDependentByCustomerIdUseCase } from './application/use-cases/dependent/find-dependent-by-customerId';
import { UpdateDependentEligibilityUseCase } from './application/use-cases/dependent/update-dependent-eligibility';
import { UpdateDependentUseCase } from './application/use-cases/dependent/update-dependent';
import { DependentController } from './adapters/controllers/dependent.controller';
import { DocumentRepository } from './infrastructure/database/repositories/document.repository';
import { CreateDocumentUseCase } from './application/use-cases/document/create-document';
import { FindDocumentByIdUseCase } from './application/use-cases/document/find-document-by-id';
import { DocumentController } from './adapters/controllers/document.controller';
import { ContractController } from './adapters/controllers/contract.controller';
import { WebhookController } from './adapters/controllers/webhook.controller';
import { UpdateCustomerUseCase } from './application/use-cases/customer/update-customer';
import { FindUserByEmailUseCase } from './application/use-cases/user/find-user-by-email';
import { AddressController } from './adapters/controllers/address.controller';
import { UpdateAddressUseCase } from './application/use-cases/address/update-address';
import { AddressRepository } from './infrastructure/database/repositories/address.repository';
import { DeleteDependentUseCase } from './application/use-cases/dependent/delete-dependent';
import { ContractRepository } from './infrastructure/database/repositories/contract.repository';
import { DocuSignService } from './infrastructure/external/docusign.service';
import { CreateEnvelopeUseCase } from '@/application/use-cases/contract/create-envelope';
import { GetEnvelopeStatusUseCase } from '@/application/use-cases/contract/get-envelope-status';
import { DownloadDocumentUseCase } from '@/application/use-cases/contract/download-document';
import { UpdateContractStatusUseCase } from '@/application/use-cases/contract/update-contract-status';
import { DeleteDocumentUseCase } from './application/use-cases/document/delete-document';

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
  dependentRepository: asClass(DependentRepository).singleton(),
  documentRepository: asClass(DocumentRepository).singleton(),
  addressRepository: asClass(AddressRepository).singleton(),
  contractRepository: asClass(ContractRepository).singleton(),

  //External Services
  documentSignService: asClass(DocuSignService).singleton().inject(() => ({
    baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY!,
    authBasePath: process.env.DOCUSIGN_AUTH_BASE_PATH || 'account-d.docusign.com',
    userId: process.env.DOCUSIGN_USER_ID!,
    privateKey: process.env.DOCUSIGN_PRIVATE_KEY!,
  })),

  //UseCases
  updateAddress: asClass(UpdateAddressUseCase).singleton(),
  updateCustomer: asClass(UpdateCustomerUseCase).singleton(),
  createCustomer: asClass(CreateCustomerUseCase).singleton(),
  findCustomerById: asClass(FindCustomerByIdUseCase).singleton(),

  createUser: asClass(CreateUserUseCase).singleton(),
  findUserById: asClass(FindUserByIdUseCase).singleton(),
  findUserByEmail: asClass(FindUserByEmailUseCase).singleton(),
  updateUser: asClass(UpdateUserUseCase).singleton(),

  createDependent: asClass(CreateDependentUseCase).singleton(),
  deleteDependent: asClass(DeleteDependentUseCase).singleton(),
  findDependentByCustomerId: asClass(FindDependentByCustomerIdUseCase).singleton(),
  updateDependentEligibility: asClass(UpdateDependentEligibilityUseCase).singleton(),
  updateDependent: asClass(UpdateDependentUseCase).singleton(),

  createDocument: asClass(CreateDocumentUseCase).singleton(),
  findDocumentById: asClass(FindDocumentByIdUseCase).singleton(),
  deleteDocument: asClass(DeleteDocumentUseCase).singleton(),

  createEnvelope: asClass(CreateEnvelopeUseCase).singleton(),
  getEnvelopeStatus: asClass(GetEnvelopeStatusUseCase).singleton(),
  downloadDocument: asClass(DownloadDocumentUseCase).singleton(),
  updateContractStatus: asClass(UpdateContractStatusUseCase).singleton(),

  //Controller
  addressController: asClass(AddressController).singleton(),
  customerController: asClass(CustomerController).singleton(),
  userController: asClass(UserController).singleton(),
  dependentController: asClass(DependentController).singleton(),
  documentController: asClass(DocumentController).singleton(),
  contractController: asClass(ContractController).singleton(),
  webhookController: asClass(WebhookController).singleton(),
});

export default container;