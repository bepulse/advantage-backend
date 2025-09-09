import { UpdateAddressUseCase } from "@/application/use-cases/address/update-address";
import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class AddressController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly updateAddress: UpdateAddressUseCase,
  ) { }

  registerRoutes() {
    this.httpServer.register(HttpMethod.PUT, "/address", async ({ body }) => {
      await this.updateAddress.execute(body);
    });
  }
}
