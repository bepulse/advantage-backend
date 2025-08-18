
export interface IHttpClient {
    get<T = any>(url: string, options?: any): Promise<T>;
    post<T = any, B = any>(url: string, body: B, options?: any): Promise<T>;
    put<T = any, B = any>(url: string, body: B, options?: any): Promise<T>;
    delete(url: string, options?: any): Promise<void>;
}