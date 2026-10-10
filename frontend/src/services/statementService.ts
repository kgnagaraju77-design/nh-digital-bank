import api from "./api";

export interface StatementAccount {
  accountId: number;
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
  currentBalance: number;
}

export interface StatementSummary {
  totalDebits: number;
  totalCredits: number;
  transactionCount: number;
}

export interface StatementTransaction {
  id: number;
  transaction_reference: string;
  sender_account_id: number;
  receiver_account_number: string;
  amount: string | number;
  transaction_type: string;
  status: string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  transaction_direction: "DEBIT" | "CREDIT" | string;
}

export interface StatementPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StatementResponse {
  success: boolean;
  message: string;
  data: {
    account: StatementAccount;
    summary: StatementSummary;
    transactions: StatementTransaction[];
    pagination: StatementPagination;
  };
}

export interface GetStatementParams {
  accountId: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getAccountStatement(
  params: GetStatementParams
): Promise<StatementResponse> {
  const {
    accountId,
    from,
    to,
    page = 1,
    limit = 10,
  } = params;

  const response = await api.get<StatementResponse>(
    `/accounts/${accountId}/statement`,
    {
      params: {
        from,
        to,
        page,
        limit,
      },
    }
  );

  return response.data;
}