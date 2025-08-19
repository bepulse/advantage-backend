import 'dotenv/config';
import container from "./container";
import { CustomerController } from './adapters/controllers/customer.controller';

const httpServer = container.resolve("httpServer");

const customerController = container.resolve<CustomerController>("customerController");
customerController.registerRoutes();

httpServer.listen(process.env.PORT);

console.log(`Server is running on port ${process.env.PORT}`);