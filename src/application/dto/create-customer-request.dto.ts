export interface CreateCustomerRequest {
  name: string;
  cpf: string;
  birthDate?: string; // Aceita string do frontend
  email: string;
  phone: string;
  address?: {
    type: 'HOME' | 'BILLING' | 'SHIPPING' | 'OTHER';
    street: string;
    number: string;
    district: string;
    complement?: string;
    city: string;
    state: string;
    country?: string;
    zipcode: string;
    isDefault?: boolean;
  };
}