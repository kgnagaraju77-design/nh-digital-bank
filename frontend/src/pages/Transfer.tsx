import "./Transfer.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import type {
  Beneficiary,
} from "../services/beneficiaryService";

import {
  getBeneficiaries,
} from "../services/beneficiaryService";

import {
  createTransfer,
} from "../services/transferService";

import type {
  Account,
} from "../services/accountService";

import {
  getAccounts,
} from "../services/accountService";

/*
 * ============================================================
 * NH DIGITAL BANK
 *
 * FUND TRANSFER
 *
 * Secure. Simple. Smart.
 *
 * FLOW
 * ------------------------------------------------------------
 * Select Account
 *      ↓
 * Select Beneficiary
 *      ↓
 * Enter Amount
 *      ↓
 * Add Remarks
 *      ↓
 * Review
 *      ↓
 * Create Pending Transaction
 *      ↓
 * Transaction PIN + OTP
 *      ↓
 * Final Confirmation
 * ============================================================
 */

type TransferStep = "FORM" | "REVIEW";

interface TransferNavigationState {
  beneficiaryId?: number;
}

function formatCurrency(
  value: number | string
): string {
  const amount = Number(value);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function maskAccount(
  accountNumber?: string
): string {
  if (!accountNumber) {
    return "•••• ••••";
  }

  if (accountNumber.length <= 4) {
    return `•••• ${accountNumber}`;
  }

  return `•••• •••• ${accountNumber.slice(-4)}`;
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };

  return (
    apiError?.response?.data?.message ||
    apiError?.response?.data?.error ||
    apiError?.message ||
    fallback
  );
}

export default function Transfer() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);

  const [senderAccountId, setSenderAccountId] =
    useState("");

  const [beneficiaryId, setBeneficiaryId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [step, setStep] =
    useState<TransferStep>("FORM");

  /*
   * ============================================================
   * LOAD ACCOUNTS + BENEFICIARIES
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          accountsResponse,
          beneficiariesResponse,
        ] = await Promise.all([
          getAccounts(),
          getBeneficiaries(),
        ]);

        if (!mounted) {
          return;
        }

        if (
          accountsResponse?.success &&
          accountsResponse?.data
        ) {
          setAccounts(
            accountsResponse.data.accounts
          );
        }

        if (
          beneficiariesResponse?.success &&
          beneficiariesResponse?.data
        ) {
          const activeBeneficiaries =
            beneficiariesResponse.data.beneficiaries.filter(
              (beneficiary) =>
                beneficiary.status === "ACTIVE"
            );

          setBeneficiaries(
            activeBeneficiaries
          );
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        console.error(
          "Transfer page loading error:",
          loadError
        );

        setError(
          getApiErrorMessage(
            loadError,
            "Unable to load transfer information."
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * PRESELECT BENEFICIARY
   *
   * Allows:
   * Beneficiaries → Send Money
   * ============================================================
   */

  useEffect(() => {
    const state =
      location.state as
        | TransferNavigationState
        | null;

    if (
      state?.beneficiaryId &&
      Number.isInteger(
        state.beneficiaryId
      )
    ) {
      setBeneficiaryId(
        String(state.beneficiaryId)
      );
    }
  }, [location.state]);

  /*
   * ============================================================
   * SELECTED ACCOUNT
   * ============================================================
   */

  const selectedAccount =
    useMemo(() => {
      return accounts.find(
        (account) =>
          String(account.id) ===
          senderAccountId
      );
    }, [
      accounts,
      senderAccountId,
    ]);

  /*
   * ============================================================
   * SELECTED BENEFICIARY
   * ============================================================
   */

  const selectedBeneficiary =
    useMemo(() => {
      return beneficiaries.find(
        (beneficiary) =>
          String(beneficiary.id) ===
          beneficiaryId
      );
    }, [
      beneficiaries,
      beneficiaryId,
    ]);

  /*
   * ============================================================
   * AMOUNT
   * ============================================================
   */

  function handleAmountChange(
    value: string
  ) {
    /*
     * Allow:
     * 100
     * 100.5
     * 100.50
     *
     * Reject:
     * 100.555
     * abc
     * special characters
     */

    if (
      !/^\d*(\.\d{0,2})?$/.test(value)
    ) {
      return;
    }

    setAmount(value);
    setError("");
  }

  /*
   * ============================================================
   * VALIDATE FORM
   * ============================================================
   */

  function validateForm(): boolean {
    setError("");

    if (!senderAccountId) {
      setError(
        "Please select the account from which you want to transfer."
      );

      return false;
    }

    if (!selectedAccount) {
      setError(
        "The selected account is no longer available."
      );

      return false;
    }

    if (!beneficiaryId) {
      setError(
        "Please select a beneficiary."
      );

      return false;
    }

    if (!selectedBeneficiary) {
      setError(
        "The selected beneficiary is no longer available."
      );

      return false;
    }

    const transferAmount =
      Number(amount);

    if (
      !amount ||
      !Number.isFinite(transferAmount) ||
      transferAmount <= 0
    ) {
      setError(
        "Please enter a valid transfer amount."
      );

      return false;
    }

    const availableBalance =
      Number(selectedAccount.balance);

    if (
      Number.isFinite(availableBalance) &&
      transferAmount > availableBalance
    ) {
      setError(
        "Insufficient available balance."
      );

      return false;
    }

    if (remarks.length > 255) {
      setError(
        "Remarks cannot exceed 255 characters."
      );

      return false;
    }

    return true;
  }

  /*
   * ============================================================
   * REVIEW
   * ============================================================
   *
   * IMPORTANT:
   * Transaction PIN and OTP are NOT required here.
   * They are collected only on TransferConfirmation.tsx.
   *
   * Flow:
   * Transfer Details -> Review -> Pending Transaction
   * -> Transaction PIN + OTP -> Final Confirmation
   * ============================================================
   */

  function handleReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStep("REVIEW");
  }

  /*
   * ============================================================
   * CREATE PENDING TRANSFER
   *
   * IMPORTANT:
   *
   * This API creates a pending transaction.
   *
   * Money must NOT be considered transferred until:
   *
   * Transaction PIN
   *       +
   * OTP
   *       +
   * Final confirmation
   *
   * are completed by the backend.
   * ============================================================
   */

  async function handleConfirmTransfer() {
    if (
      submitting ||
      !selectedAccount ||
      !selectedBeneficiary
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await createTransfer({
          senderAccountId:
            Number(senderAccountId),

          beneficiaryId:
            Number(beneficiaryId),

          amount:
            Number(amount),

          remarks:
            remarks.trim() ||
            undefined,
        });

      if (
        !response?.success ||
        !response?.data?.transaction
      ) {
        throw new Error(
          response?.message ||
          "Unable to create transfer."
        );
      }

      const transactionId =
    response.data.transaction.transactionId;

      if (
        !Number.isInteger(transactionId) ||
        transactionId <= 0
      ) {
        throw new Error(
          "Invalid transaction ID received from the bank."
        );
      }

      /*
       * Continue to secure confirmation.
       *
       * Sensitive values such as PIN and OTP
       * are intentionally NOT stored in navigation state.
       */

      navigate(
        "/transfers/confirm",
        {
          state: {
            transactionId,

            senderAccount:
              selectedAccount,

            beneficiary:
              selectedBeneficiary,

            amount:
              Number(amount),

            remarks:
              remarks.trim(),
          },
        }
      );
    } catch (transferError) {
      console.error(
        "Transfer creation error:",
        transferError
      );

      setError(
        getApiErrorMessage(
          transferError,
          "Unable to create transfer."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div
        className="transfer-page"
        data-testid="transfer-page"
        aria-busy="true"
      >
        <div className="transfer-container">

          <div
            className="transfer-loading-card"
            data-testid="transfer-loading"
          >
            <div className="transfer-loading-spinner" />

            <h2>
              Loading transfer information
            </h2>

            <p>
              Please wait while we securely
              load your accounts and beneficiaries.
            </p>
          </div>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * INITIAL LOAD ERROR
   * ============================================================
   */

  if (
    error &&
    accounts.length === 0 &&
    beneficiaries.length === 0
  ) {
    return (
      <div
        className="transfer-page"
        data-testid="transfer-page"
      >
        <div className="transfer-container">

          <div
            className="transfer-error-card"
            data-testid="transfer-error"
            role="alert"
          >
            <div className="transfer-error-icon">
              !
            </div>

            <h1>
              Unable to start transfer
            </h1>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="transfer-primary-button"
              data-testid="back-to-beneficiaries"
              onClick={() =>
                navigate("/beneficiaries")
              }
            >
              Back to Beneficiaries
            </button>
          </div>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * REVIEW SCREEN
   * ============================================================
   */

  if (step === "REVIEW") {
    return (
      <div
        className="transfer-page"
        data-testid="transfer-review-page"
      >
        <div className="transfer-container">

          <header className="transfer-header">

            <div>
              <button
                type="button"
                className="transfer-back-button"
                data-testid="back-to-transfer-form"
                onClick={() =>
                  setStep("FORM")
                }
                disabled={submitting}
              >
                ← Back to transfer
              </button>

              <div className="transfer-title-row">

                <div className="transfer-page-icon">
                  ₹
                </div>

                <div>
                  <h1>
                    Review Transfer
                  </h1>

                  <p>
                    Please verify the transfer
                    details before continuing.
                  </p>
                </div>

              </div>
            </div>

            <div className="transfer-secure-badge">
              🔒 Secure Transfer
            </div>

          </header>

          {error && (
            <div
              className="transfer-error"
              data-testid="transfer-error"
              role="alert"
            >
              <div className="transfer-error-icon">
                !
              </div>

              <div>
                <strong>
                  Transfer could not be continued
                </strong>

                <p>
                  {error}
                </p>
              </div>
            </div>
          )}

          <section
            className="transfer-review-card"
            data-testid="transfer-review"
          >

            <div className="transfer-review-header">

              <div>
                <h2>
                  Transfer Summary
                </h2>

                <p>
                  Check the account, beneficiary
                  and amount carefully.
                </p>
              </div>

              <span className="transfer-pending-badge">
                Pending Authorization
              </span>

            </div>

            <div className="transfer-route">

              <div className="transfer-party">

                <span className="transfer-summary-label">
                  FROM ACCOUNT
                </span>

                <div className="transfer-party-content">

                  <div className="transfer-party-icon">
                    ₹
                  </div>

                  <div>
                    <strong>
                      {selectedAccount?.account_type ||
                        "Bank Account"}
                    </strong>

                    <span>
                      {maskAccount(
                        selectedAccount?.account_number
                      )}
                    </span>
                  </div>

                </div>

              </div>

              <div
                className="transfer-route-arrow"
                aria-hidden="true"
              >
                →
              </div>

              <div className="transfer-party">

                <span className="transfer-summary-label">
                  TO BENEFICIARY
                </span>

                <div className="transfer-party-content">

                  <div className="transfer-party-icon beneficiary">
                    👤
                  </div>

                  <div>
                    <strong>
                      {selectedBeneficiary
                        ?.beneficiary_name ||
                        "-"}
                    </strong>

                    <span>
                      {maskAccount(
                        selectedBeneficiary?.account_number
                      )}
                    </span>

                    <small>
                      {selectedBeneficiary?.bank_name}
                    </small>
                  </div>

                </div>

              </div>

            </div>

            <div className="transfer-review-amount-box">

              <span>
                Transfer Amount
              </span>

              <strong
                data-testid="review-transfer-amount"
              >
                {formatCurrency(amount)}
              </strong>

            </div>

            {remarks && (
              <div className="transfer-review-remarks">

                <span>
                  Remarks
                </span>

                <p>
                  {remarks}
                </p>

              </div>
            )}

          </section>

          <section
            className="transfer-security-notice"
            data-testid="transfer-security-notice"
          >

            <div className="transfer-security-icon">
              🛡️
            </div>

            <div>
              <strong>
                Secure authorization required
              </strong>

              <p>
                This is only a review step. The
                transfer will require your
                Transaction PIN and OTP before
                the payment is completed.
              </p>
            </div>

          </section>

          <div className="transfer-review-actions">

            <button
              type="button"
              className="transfer-secondary-button"
              onClick={() =>
                setStep("FORM")
              }
              disabled={submitting}
            >
              Edit Transfer
            </button>

            <button
              type="button"
              className="transfer-primary-button"
              data-testid="confirm-transfer-button"
              onClick={
                handleConfirmTransfer
              }
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="button-spinner" />
                  Creating Transfer...
                </>
              ) : (
                <>
                  Continue to Secure Confirmation
                  <span>→</span>
                </>
              )}
            </button>

          </div>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * TRANSFER FORM
   * ============================================================
   */

  return (
    <div
      className="transfer-page"
      data-testid="transfer-page"
    >
      <div className="transfer-container">

        <header className="transfer-header">

          <div>

            <button
              type="button"
              className="transfer-back-button"
              data-testid="back-to-beneficiaries"
              onClick={() =>
                navigate("/beneficiaries")
              }
            >
              ← Back to Beneficiaries
            </button>

            <div className="transfer-title-row">

              <div className="transfer-page-icon">
                ₹
              </div>

              <div>
                <h1>
                  Transfer Money
                </h1>

                <p>
                  Send money securely to your
                  beneficiary.
                </p>
              </div>

            </div>

          </div>

          <div className="transfer-secure-badge">
            🔒 Secure Banking
          </div>

        </header>

        {error && (
          <div
            className="transfer-error"
            data-testid="transfer-error"
            role="alert"
          >
            <div className="transfer-error-icon">
              !
            </div>

            <div>
              <strong>
                Please check your transfer details
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        <section className="transfer-card">

          <div className="transfer-card-header">

            <div>
              <h2>
                Make a Transfer
              </h2>

              <p>
                Choose an account and beneficiary,
                then enter the amount.
              </p>
            </div>

            <div
              className="transfer-step-indicator"
              aria-label="Transfer progress"
            >
              <span className="active">
                1
              </span>

              <div />

              <span>
                2
              </span>

              <div />

              <span>
                3
              </span>
            </div>

          </div>

          <form
            className="transfer-form"
            data-testid="transfer-form"
            onSubmit={handleReview}
            noValidate
          >

            {/* SENDER ACCOUNT */}

            <div className="transfer-form-group">

              <label htmlFor="sender-account">
                From Account
              </label>

              <select
                id="sender-account"
                className="transfer-select"
                data-testid="sender-account-select"
                value={senderAccountId}
                onChange={(event) => {
                  setSenderAccountId(
                    event.target.value
                  );
                  setError("");
                }}
                disabled={submitting}
                aria-label="Select sender account"
              >
                <option value="">
                  Select your account
                </option>

                {accounts.map(
                  (account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {maskAccount(
                        account.account_number
                      )}
                      {" — "}
                      {formatCurrency(
                        account.balance
                      )}
                    </option>
                  )
                )}

              </select>

              {selectedAccount && (
                <div
                  className="transfer-account-info"
                  data-testid="available-balance"
                >
                  <div>
                    <span>
                      Available balance
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedAccount.balance
                      )}
                    </strong>
                  </div>

                  <span className="transfer-account-type">
                    {selectedAccount.account_type ||
                      "Bank Account"}
                  </span>
                </div>
              )}

            </div>

            {/* BENEFICIARY */}

            <div className="transfer-form-group">

              <div className="field-label-row">

                <label htmlFor="beneficiary">
                  To Beneficiary
                </label>

                <button
                  type="button"
                  className="inline-link-button"
                  onClick={() =>
                    navigate(
                      "/beneficiaries/add"
                    )
                  }
                  disabled={submitting}
                >
                  + Add beneficiary
                </button>

              </div>

              <select
                id="beneficiary"
                className="transfer-select"
                data-testid="beneficiary-select"
                value={beneficiaryId}
                onChange={(event) => {
                  setBeneficiaryId(
                    event.target.value
                  );
                  setError("");
                }}
                disabled={submitting}
                aria-label="Select beneficiary"
              >
                <option value="">
                  Select beneficiary
                </option>

                {beneficiaries.map(
                  (beneficiary) => (
                    <option
                      key={beneficiary.id}
                      value={beneficiary.id}
                    >
                      {beneficiary.beneficiary_name}
                      {" — "}
                      {beneficiary.bank_name}
                    </option>
                  )
                )}

              </select>

              {selectedBeneficiary && (
                <div
                  className="transfer-beneficiary-card"
                  data-testid="selected-beneficiary"
                >

                  <div className="transfer-beneficiary-icon">
                    👤
                  </div>

                  <div className="transfer-beneficiary-details">

                    <strong>
                      {selectedBeneficiary.beneficiary_name}
                    </strong>

                    <span>
                      {selectedBeneficiary.bank_name}
                    </span>

                    <span>
                      {maskAccount(
                        selectedBeneficiary.account_number
                      )}
                    </span>

                    <small>
                      IFSC:{" "}
                      {selectedBeneficiary.ifsc_code}
                    </small>

                  </div>

                  <span className="beneficiary-active">
                    Active
                  </span>

                </div>
              )}

            </div>

            {/* AMOUNT */}

            <div className="transfer-form-group">

              <label htmlFor="transfer-amount">
                Transfer Amount
              </label>

              <div className="transfer-amount-wrapper">

                <span
                  className="transfer-amount-symbol"
                  aria-hidden="true"
                >
                  ₹
                </span>

                <input
                  id="transfer-amount"
                  className="transfer-amount-input"
                  data-testid="transfer-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) =>
                    handleAmountChange(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  aria-describedby="amount-helper"
                />

              </div>

              <div
                id="amount-helper"
                className="amount-helper"
              >
                <span>
                  Available
                </span>

                <strong>
                  {selectedAccount
                    ? formatCurrency(
                        selectedAccount.balance
                      )
                    : "—"}
                </strong>
              </div>

            </div>

            {/* REMARKS */}

            <div className="transfer-form-group">

              <div className="field-label-row">

                <label htmlFor="transfer-remarks">
                  Remarks
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <span className="character-count">
                  {remarks.length}/255
                </span>

              </div>

              <textarea
                id="transfer-remarks"
                className="transfer-textarea"
                data-testid="transfer-remarks"
                value={remarks}
                onChange={(event) =>
                  setRemarks(
                    event.target.value
                  )
                }
                placeholder="Add a note for this transfer"
                maxLength={255}
                disabled={submitting}
                rows={4}
              />

            </div>

            {/* SECURITY NOTICE */}

            <div
              className="transfer-security-notice"
              data-testid="transfer-security-notice"
            >

              <div className="transfer-security-icon">
                🛡️
              </div>

              <div>
                <strong>
                  Your transfer is protected
                </strong>

                <p>
                  You'll verify this payment
                  with your Transaction PIN and
                  OTP before any money is moved.
                </p>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="transfer-actions">

              <button
                type="button"
                className="transfer-secondary-button"
                onClick={() =>
                  navigate(
                    "/beneficiaries"
                  )
                }
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="transfer-primary-button"
                data-testid="review-transfer-button"
                disabled={submitting}
              >
                Review Transfer
                <span>→</span>
              </button>

            </div>

          </form>

        </section>

        <div className="transfer-footer-security">
          <span>🔒</span>
          <span>Secured by NH Digital Bank</span>
          <span>•</span>
          <span>Never share your PIN or OTP</span>
        </div>

      </div>
    </div>
  );
}
