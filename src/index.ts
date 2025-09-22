import 'dotenv/config';
import container from "./container";
import { CustomerController } from './adapters/controllers/customer.controller';
import { UserController } from './adapters/controllers/user.controller';
import { DependentController } from './adapters/controllers/dependent.controller';
import { DocumentController } from './adapters/controllers/document.controller';
import { ContractController } from './adapters/controllers/contract.controller';
import { WebhookController } from './adapters/controllers/webhook.controller';
import { AddressController } from './adapters/controllers/address.controller';

const httpServer = container.resolve("httpServer");

const addressController = container.resolve<AddressController>("addressController");
const customerController = container.resolve<CustomerController>("customerController");
const userController = container.resolve<UserController>("userController");
const dependentController = container.resolve<DependentController>("dependentController");
const documentController = container.resolve<DocumentController>("documentController");
const contractController = container.resolve<ContractController>("contractController");
const webhookController = container.resolve<WebhookController>("webhookController");

addressController.registerRoutes();
customerController.registerRoutes();
dependentController.registerRoutes();
documentController.registerRoutes();
contractController.registerRoutes();
webhookController.registerRoutes();
userController.registerRoutes();

httpServer.listen(process.env.PORT, '0.0.0.0');

console.log(`Server is running on port ${process.env.PORT}`);