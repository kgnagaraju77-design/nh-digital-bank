import api from "./api";

/*
 * ============================================================
 * TRANSFER TYPES
 * ============================================================
 */

export interface TransferRequest {
  senderAccountId: number;
  beneficiaryId: number;
  amount: number;
  remarks?: string;
}

export interface Transaction {
  transactionId: number;
  transactionReference?: string;
  amount: number | string;
  status?: string;
  senderAccount?: string;
  receiverAccount?: string;
  beneficiaryId?: number;

  sender_account_id?: number;
  receiver_account_id?: number;
  beneficiary_id?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}
export interface TransferResponse {
  success: boolean;
  message: string;
  data?: {
    transaction?: Transaction;
    referenceNumber?: string;
    reference_number?: string;
  };
}

/*
 * ============================================================
 * INITIATE / CREATE TRANSFER
 *
 * POST /api/transfers
 *
 * Creates a PENDING transaction.
 * No transaction PIN or OTP should be sent here.
 * ============================================================
 */

export async function createTransfer(
  data: TransferRequest
): Promise<TransferResponse> {
  const response = await api.post<TransferResponse>(
    "/transfers",
    data
  );

  return response.data;
}

/*
 * ============================================================
 * CONFIRM TRANSFER
 *
 * POST /api/transfers/confirm
 *
 * Final secure authorization:
 *
 * Transaction ID
 *       +
 * Transaction PIN
 *       +
 * OTP
 * ============================================================
 */

export interface ConfirmTransferRequest {
  transactionId: number;
  transactionPin: string;
  otp: string;
}

export async function confirmTransfer(
  data: ConfirmTransferRequest
): Promise<TransferResponse> {
  const response = await api.post<TransferResponse>(
    "/transfers/confirm",
    data
  );

  return response.data;
}