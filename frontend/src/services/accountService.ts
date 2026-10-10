import api from "./api";

export interface Account {
  id: number;
  user_id?: number;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
  currency?: string;
}

export interface StatementTransaction {
  id: number;
  transaction_reference?: string;
  sender_account_id?: number;
  receiver_account_number?: string;
  amount: string | number;
  transaction_type?: string;
  transfer_type?: string;
  status: string;
  remarks?: string | null;
  created_at: string;
  updated_at?: string;
  transaction_direction?: "DEBIT" | "CREDIT" | string;
}

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

export interface StatementPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AccountsResponse {
  success: boolean;
  message?: string;
  data: {
    accounts: Account[];
  };
}

export interface AccountStatementResponse {
  success: boolean;
  message: string;
  data: {
    account: StatementAccount;
    summary: StatementSummary;
    transactions: StatementTransaction[];
    pagination: StatementPagination;
  };
}

export interface GetAccountStatementParams {
  accountId: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getAccounts(): Promise<AccountsResponse> {
  const token = localStorage.getItem("nh_token");

  const response = await api.get<AccountsResponse>(
    "/accounts",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getAccountStatement(
  params: GetAccountStatementParams
): Promise<AccountStatementResponse> {
  const token = localStorage.getItem("nh_token");

  const {
    accountId,
    from,
    to,
    page = 1,
    limit = 10,
  } = params;

  const response =
    await api.get<AccountStatementResponse>(
      `/accounts/${accountId}/statement`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          from,
          to,
          page,
          limit,
        },
      },
    );

  return response.data;
}