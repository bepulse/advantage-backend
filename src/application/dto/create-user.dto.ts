export interface CreateUserResponse {
    id: string,
    role: string,
    email : string,
    customerId: string | null,
}