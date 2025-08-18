
export default interface IHttpServer {
    register(
        method: 'get' | 'post' | 'put' | 'delete',
        url: string,
        callback: (params: any, body: any) => Promise<any>
    ): void

    listen(port: number): void;
}