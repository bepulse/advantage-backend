import 'dotenv/config';
import container from "./container";
import { CustomerController } from './adapters/controllers/customer.controller';
import { UserController } from './adapters/controllers/user.controller';
import { DependentController } from './adapters/controllers/dependent.controller';
import { DocumentController } from './adapters/controllers/document.controller';

const httpServer = container.resolve("httpServer");

const customerController = container.resolve<CustomerController>("customerController");
const userController = container.resolve<UserController>("userController");
const dependentController = container.resolve<DependentController>("dependentController");
const documentController = container.resolve<DocumentController>("documentController")

customerController.registerRoutes();
dependentController.registerRoutes();
documentController.registerRoutes();
userController.registerRoutes();

httpServer.listen(process.env.PORT);

console.log(`Server is running on port ${process.env.PORT}`);