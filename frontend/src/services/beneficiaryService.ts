import api from "./api";


/*
 * ============================================================
 * NH DIGITAL BANK
 * BENEFICIARY SERVICE
 * ============================================================
 *
 * All beneficiary API requests are authenticated automatically
 * by the Axios interceptor configured in:
 *
 *     src/services/api.ts
 *
 * The service therefore does NOT manually read or attach the
 * JWT token.
 *
 * ============================================================
 */


/*
 * ============================================================
 * BENEFICIARY
 * ============================================================
 */

export interface Beneficiary {

  id: number;

  beneficiary_name: string;

  account_number: string;

  bank_name: string;

  ifsc_code: string;

  status:
    | "ACTIVE"
    | "DELETED";

  created_at: string;

  updated_at: string;

}


/*
 * ============================================================
 * GET BENEFICIARIES RESPONSE
 * ============================================================
 */

export interface BeneficiaryResponse {

  success: boolean;

  data: {

    beneficiaries:
      Beneficiary[];

  };

}


/*
 * ============================================================
 * ADD BENEFICIARY REQUEST
 * ============================================================
 */

export interface AddBeneficiaryRequest {

  beneficiaryName: string;

  accountNumber: string;

  bankName: string;

  ifscCode: string;

}


/*
 * ============================================================
 * ADD BENEFICIARY RESPONSE
 * ============================================================
 */

export interface AddBeneficiaryResponse {

  success: boolean;

  message: string;

  data?: {

    beneficiary?: Beneficiary;

    id?: number;

  };

}


/*
 * ============================================================
 * GET BENEFICIARIES
 *
 * GET /api/beneficiaries
 *
 * Authentication:
 * Axios request interceptor automatically adds:
 *
 * Authorization: Bearer <JWT>
 *
 * ============================================================
 */

export async function getBeneficiaries():

  Promise<BeneficiaryResponse> {

  const response =
    await api.get<BeneficiaryResponse>(
      "/beneficiaries"
    );


  return response.data;

}


/*
 * ============================================================
 * ADD BENEFICIARY
 *
 * POST /api/beneficiaries
 *
 * ============================================================
 */

export async function addBeneficiary(

  data: AddBeneficiaryRequest

): Promise<AddBeneficiaryResponse> {

  const response =
    await api.post<AddBeneficiaryResponse>(
      "/beneficiaries",
      data
    );


  return response.data;

}