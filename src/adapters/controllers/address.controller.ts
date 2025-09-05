import { UpdateAddressUseCase } from "@/application/use-cases/address/update-address";
import IHttpServer from "@/shared/interfaces/http/http-server";

export class AddressController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly updateAddress: UpdateAddressUseCase,
  ) { }

  registerRoutes() {
    this.httpServer.register("put", "/address", async (params, body) => {
      await this.updateAddress.execute(body);
    });
  }
}
