import api from "./api";

export type TransactionStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED";

export type TransactionType =
  | "FUND_TRANSFER"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "PAYMENT";

export interface Transaction {
  id: number;
  transaction_reference: string;
  sender_account_id: number;
  beneficiary_id?: number;
  receiver_account_number: string;
  amount: string | number;
  transaction_type: TransactionType | string;
  status: TransactionStatus | string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  sender_account_number: string;
  beneficiary_name?: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
  };
}

export interface TransactionDetailsResponse {
  success: boolean;
  data: {
    transaction: Transaction;
  };
}

export async function getTransactions(): Promise<TransactionsResponse> {
  const response = await api.get<TransactionsResponse>(
    "/transactions"
  );

  return response.data;
}

export async function getTransactionById(
  transactionId: number
): Promise<TransactionDetailsResponse> {
  const response =
    await api.get<TransactionDetailsResponse>(
      `/transactions/${transactionId}`
    );

  return response.data;
}