export interface ToggleCustomerBlockStatusDto {
  customerId: string;
  isBlocked: boolean;
  blockReason?: string;
}
