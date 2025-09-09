import { HttpMethod } from "@/shared/types/http-method.enum";

export default interface IHttpServer {
    register(
        method: HttpMethod,
        url: string,
        callback: (req: any) => Promise<any>
    ): void

    listen(port: number): void;
}