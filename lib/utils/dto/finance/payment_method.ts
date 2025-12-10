import type DateTime from "../../data/DateTime";

export interface PaymentMethodDto {
  id: number;
  code: string;
  fullName: string;
  description?: string | null;
  requiresReference: boolean;
  requiresBankAccount: boolean;
  isEnabled: boolean;
  createdAt: DateTime;
  updatedAt?: DateTime | null;
}

export type CreatePaymentMethodDto = Omit<
  PaymentMethodDto,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdatePaymentMethodDto = Partial<CreatePaymentMethodDto> & {
  id: number;
};

export interface ListPaymentMethodsParams {
  code?: string;
  fullName?: string;
  isEnabled?: boolean;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface ListPaymentMethodsResult {
  paymentMethods: PaymentMethodDto[];
  totalCount: number;
}
