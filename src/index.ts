import 'dotenv/config';
import container from "./container";
import { CustomerController } from './adapters/controllers/customer.controller';
import { UserController } from './adapters/controllers/user.controller';

const httpServer = container.resolve("httpServer");

const customerController = container.resolve<CustomerController>("customerController");
const userController = container.resolve<UserController>("userController");
customerController.registerRoutes();
userController.registerRoutes();


httpServer.listen(process.env.PORT);

console.log(`Server is running on port ${process.env.PORT}`);