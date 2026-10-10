import api from "./api";

export type OtpPurpose =
  | "FUND_TRANSFER"
  | "LOGIN"
  | "PASSWORD_RESET"
  | "BENEFICIARY";

export interface GenerateOtpRequest {
  transactionId: number;
  purpose: OtpPurpose;
}

export interface GenerateOtpResponse {
  success: boolean;
  message: string;
  data?: {
    otp?: string;
    otpId?: number;
    transactionId?: number;
    purpose?: OtpPurpose;
    expiresAt?: string;
  };
}

export interface VerifyOtpRequest {
  otp: string;
  transactionId: number;
  purpose: OtpPurpose;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    verified?: boolean;
  };
}

/*
 * ============================================================
 * GENERATE OTP
 *
 * POST /api/security/otp/generate
 * ============================================================
 */

export async function generateOtp(
  data: GenerateOtpRequest
): Promise<GenerateOtpResponse> {
  const response = await api.post<GenerateOtpResponse>(
    "/security/otp/generate",
    data
  );

  return response.data;
}

/*
 * ============================================================
 * VERIFY OTP
 *
 * POST /api/security/otp/verify
 * ============================================================
 */

export async function verifyOtp(
  data: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>(
    "/security/otp/verify",
    data
  );

  return response.data;
}