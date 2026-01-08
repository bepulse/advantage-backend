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
import { FindDependentWithDocumentsByCustomerIdUseCase } from './application/use-cases/dependent/find-dependent-with-documents-by-customerId';
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
import { CreateRecipientViewUseCase } from '@/application/use-cases/contract/create-recipient-view';
import { CreateEnvelopeAndGetSigningUrlUseCase } from '@/application/use-cases/contract/create-envelope-and-signing-url';
import { DeleteDocumentUseCase } from './application/use-cases/document/delete-document';
import { UploadDocumentUseCase } from './application/use-cases/document/upload-document';
import { DownloadDocumentUseCase as DocumentDownloadUseCase } from './application/use-cases/document/download-document';
import { GetPresignedDownloadUrlUseCase } from './application/use-cases/document/get-presigned-download-url';
import { UpdateDocumentApprovalUseCase } from './application/use-cases/document/update-document-approval';
import { AWSS3Service } from './infrastructure/external/aws-s3.service';
import { FindPendingsUseCase } from './application/use-cases/customer/find-pendings';
import { FindCustomerByCPFUseCase } from './application/use-cases/customer/find-customer-by-cpf';
import { CheckCustomerEligibilityUseCase } from './application/use-cases/customer/check-customer-eligibility';
import { HealthController } from './adapters/controllers/health.controller';
import { ReportController } from './adapters/controllers/report.controller';
import { ReportService } from './application/services/report.service';
import { FindCustomerByEmailUseCase } from './application/use-cases/customer/find-customer-by-email';
import { SearchCustomersByNameUseCase } from './application/use-cases/customer/search-customers-by-name';
import { FindDependentByCpfUseCase } from './application/use-cases/dependent/find-dependent-by-cpf';
import { ToggleCustomerBlockStatusUseCase } from './application/use-cases/customer/toggle-customer-block-status';

const {
  DOCUSIGN_BASE_URL,
  DOCUSIGN_INTEGRATION_KEY,
  DOCUSIGN_AUTH_BASE_PATH,
  DOCUSIGN_USER_ID,
  DOCUSIGN_PRIVATE_KEY_BASE64,
  DOCUSIGN_TEMPLATE_ID,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME
} = process.env;

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

  // Services
  documentSignService: asClass(DocuSignService).singleton().inject(() => ({
    baseUrl: DOCUSIGN_BASE_URL,
    integrationKey: DOCUSIGN_INTEGRATION_KEY!,
    authBasePath: DOCUSIGN_AUTH_BASE_PATH,
    userId: DOCUSIGN_USER_ID!,
    privateKey: DOCUSIGN_PRIVATE_KEY_BASE64!,
    templateId: DOCUSIGN_TEMPLATE_ID!,
  })),

  awsS3Service: asClass(AWSS3Service).singleton().inject(() => ({
    region: AWS_REGION || 'us-east-1',
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    bucketName: AWS_S3_BUCKET_NAME!,
  })),

  reportService: asClass(ReportService).singleton(),

  //UseCases
  updateAddress: asClass(UpdateAddressUseCase).singleton(),
  updateCustomer: asClass(UpdateCustomerUseCase).singleton(),
  createCustomer: asClass(CreateCustomerUseCase).singleton(),
  findCustomerById: asClass(FindCustomerByIdUseCase).singleton(),
  findPendings: asClass(FindPendingsUseCase).singleton(),
  findCustomerByCPF: asClass(FindCustomerByCPFUseCase).singleton(),
  findCustomerByEmail: asClass(FindCustomerByEmailUseCase).singleton(),
  searchCustomersByName: asClass(SearchCustomersByNameUseCase).singleton(),
  checkCustomerEligibility: asClass(CheckCustomerEligibilityUseCase).singleton(),
  toggleCustomerBlockStatus: asClass(ToggleCustomerBlockStatusUseCase).singleton(),

  createUser: asClass(CreateUserUseCase).singleton(),
  findUserById: asClass(FindUserByIdUseCase).singleton(),
  findUserByEmail: asClass(FindUserByEmailUseCase).singleton(),
  updateUser: asClass(UpdateUserUseCase).singleton(),

  createDependent: asClass(CreateDependentUseCase).singleton(),
  deleteDependent: asClass(DeleteDependentUseCase).singleton(),
  findDependentByCustomerId: asClass(FindDependentByCustomerIdUseCase).singleton(),
  findDependentByCpf: asClass(FindDependentByCpfUseCase).singleton(),
  findDependentWithDocumentsByCustomerId: asClass(FindDependentWithDocumentsByCustomerIdUseCase).singleton(),
  updateDependentEligibility: asClass(UpdateDependentEligibilityUseCase).singleton(),
  updateDependent: asClass(UpdateDependentUseCase).singleton(),

  createDocument: asClass(CreateDocumentUseCase).singleton(),
  findDocumentById: asClass(FindDocumentByIdUseCase).singleton(),
  deleteDocument: asClass(DeleteDocumentUseCase).singleton(),
  uploadDocument: asClass(UploadDocumentUseCase).singleton(),
  downloadDocumentFile: asClass(DocumentDownloadUseCase).singleton(),
  getPresignedDownloadUrl: asClass(GetPresignedDownloadUrlUseCase).singleton(),
  updateDocumentApproval: asClass(UpdateDocumentApprovalUseCase).singleton(),

  createEnvelope: asClass(CreateEnvelopeUseCase).singleton(),
  getEnvelopeStatus: asClass(GetEnvelopeStatusUseCase).singleton(),
  downloadDocument: asClass(DownloadDocumentUseCase).singleton(),
  updateContractStatus: asClass(UpdateContractStatusUseCase).singleton(),
  createRecipientView: asClass(CreateRecipientViewUseCase).singleton(),
  createEnvelopeAndGetSigningUrl: asClass(CreateEnvelopeAndGetSigningUrlUseCase).singleton(),

  // Controllers
  addressController: asClass(AddressController).singleton(),
  customerController: asClass(CustomerController).singleton(),
  userController: asClass(UserController).singleton(),
  dependentController: asClass(DependentController).singleton(),
  documentController: asClass(DocumentController).singleton(),
  contractController: asClass(ContractController).singleton(),
  webhookController: asClass(WebhookController).singleton(),
  healthController: asClass(HealthController).singleton(),
  reportController: asClass(ReportController).singleton(),
});

export default container;