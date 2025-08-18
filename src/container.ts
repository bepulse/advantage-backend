import 'dotenv/config';
import { asClass, createContainer, InjectionMode } from "awilix";
import { ExpressAdapter } from "./infrastructure/http/express.adapter";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
    httpServer: asClass(ExpressAdapter).singleton(),
});

export default container;