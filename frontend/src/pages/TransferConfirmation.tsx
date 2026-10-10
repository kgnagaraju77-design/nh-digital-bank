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

import type {
  Account,
} from "../services/accountService";

import {
  confirmTransfer,
} from "../services/transferService";

import {
  generateOtp,
} from "../services/otpService";

import "./TransferConfirmation.css";

interface TransferConfirmationState {
  transactionId: number;
  senderAccount: Account;
  beneficiary: Beneficiary;
  amount: number;
  remarks?: string;
}

type PageStatus =
  | "READY"
  | "SUCCESS";

export default function TransferConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const transfer =
    location.state as
      | TransferConfirmationState
      | null;

  const [transactionPin, setTransactionPin] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpGenerated, setOtpGenerated] =
  useState(false);

const [generatedOtp, setGeneratedOtp] =
  useState("");

const [expiresAt, setExpiresAt] =
  useState<Date | null>(null);

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const [generatingOtp, setGeneratingOtp] =
    useState(false);

  const [confirming, setConfirming] =
    useState(false);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState<PageStatus>("READY");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  /*
   * ============================================================
   * INVALID DIRECT ACCESS
   * ============================================================
   */

  useEffect(() => {
    if (!transfer?.transactionId) {
      navigate("/transfers", {
        replace: true,
      });
    }
  }, [
    transfer,
    navigate,
  ]);

  /*
   * ============================================================
   * OTP COUNTDOWN
   * ============================================================
   */

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const difference =
        expiresAt.getTime() -
        Date.now();

      const seconds = Math.max(
        0,
        Math.ceil(
          difference / 1000
        )
      );

      setRemainingSeconds(seconds);

      if (seconds === 0) {
        setOtpGenerated(false);
      }
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAt]);

  /*
   * ============================================================
   * OTP TIMER FORMAT
   * ============================================================
   */

  const otpTimer =
    useMemo(() => {
      const minutes =
        Math.floor(
          remainingSeconds / 60
        );

      const seconds =
        remainingSeconds % 60;

      return `${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }, [
      remainingSeconds,
    ]);

  /*
   * ============================================================
   * API ERROR
   * ============================================================
   */

  function getErrorMessage(
    error: unknown
  ): string {
    const apiError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

    return (
      apiError?.response?.data?.message ||
      apiError?.message ||
      "Unable to complete the request."
    );
  }

  /*
   * ============================================================
   * CURRENCY
   * ============================================================
   */

  function formatCurrency(
    value: number
  ): string {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  /*
   * ============================================================
   * ACCOUNT MASKING
   * ============================================================
   */

  function maskAccount(
    value?: string
  ): string {
    if (!value) {
      return "•••• ••••";
    }

    if (value.length <= 4) {
      return `•••• ${value}`;
    }

    return `•••• •••• ${value.slice(
      -4
    )}`;
  }

  /*
   * ============================================================
   * GENERATE OTP
   * ============================================================
   */

  async function handleGenerateOtp() {
    if (
      generatingOtp ||
      confirming ||
      !transfer?.transactionId
    ) {
      return;
    }

    setError("");
    setGeneratingOtp(true);

    try {
      const response =
        await generateOtp({
          transactionId:
            transfer.transactionId,

          purpose:
            "FUND_TRANSFER",
        });

      if (!response.success) {
        throw new Error(
          response.message ||
          "Unable to generate OTP."
        );
      }

      /*
       * Backend OTP expiry should be authoritative.
       * Five minutes is only a fallback for an
       * environment where expiresAt isn't returned.
       */

      const expiry =
        response.data?.expiresAt
          ? new Date(
              response.data.expiresAt
            )
          : new Date(
              Date.now() +
                5 * 60 * 1000
            );

      setExpiresAt(expiry);
      setOtpGenerated(true);
      setOtp("");
// Development/testing only
setGeneratedOtp(response.data?.otp || "");

    } catch (error) {
      setError(
        getErrorMessage(error)
      );
      setOtpGenerated(false);
    } finally {
      setGeneratingOtp(false);
    }
  }

  /*
   * ============================================================
   * CONFIRM TRANSFER
   * ============================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      confirming ||
      !transfer?.transactionId
    ) {
      return;
    }

    setError("");

    if (
      !/^\d{6}$/.test(
        transactionPin
      )
    ) {
      setError(
        "Please enter your 6-digit transaction PIN."
      );
      return;
    }

    if (!otpGenerated) {
      setError(
        "Please generate an OTP first."
      );
      return;
    }

    if (remainingSeconds <= 0) {
      setError(
        "Your OTP has expired. Please generate a new OTP."
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    setConfirming(true);

    try {
      const response =
        await confirmTransfer({
          transactionId:
            transfer.transactionId,

          transactionPin,

          otp,
        });

      if (!response.success) {
        throw new Error(
          response.message ||
          "Transfer confirmation failed."
        );
      }

      /*
       * Do not keep sensitive credentials
       * after successful confirmation.
       */

      setTransactionPin("");
      setOtp("");

      const returnedReference =
  response.data?.transaction?.transactionReference || "";

setReferenceNumber(
  returnedReference ||
  `TXN-${transfer.transactionId}`
);

      setStatus("SUCCESS");

    } catch (error) {
      setError(
        getErrorMessage(error)
      );
    } finally {
      setConfirming(false);
    }
  }

  /*
   * ============================================================
   * WAIT FOR REDIRECT
   * ============================================================
   */

  if (!transfer?.transactionId) {
    return null;
  }

  /*
   * ============================================================
   * SUCCESS
   * ============================================================
   */

  if (status === "SUCCESS") {
    return (
      <div
        className="transfer-confirmation-page"
        data-testid="transfer-confirmation-page"
      >
        <div
          className="confirmation-success-card"
          data-testid="transfer-success"
        >

          <div className="success-icon">
            ✓
          </div>

          <div className="success-label">
            TRANSFER COMPLETED
          </div>

          <h1>
            Transfer Successful
          </h1>

          <p className="success-message">
            Your transfer has been
            successfully processed.
          </p>

          <div
            className="success-amount"
            data-testid="confirmation-success-amount"
          >
            {formatCurrency(
              transfer.amount
            )}
          </div>

          <div className="success-details">

            <div>
              <span>
                Beneficiary
              </span>

              <strong>
                {
                  transfer.beneficiary
                    .beneficiary_name
                }
              </strong>
            </div>

            <div>
              <span>
                Account
              </span>

              <strong>
                {maskAccount(
                  transfer.beneficiary
                    .account_number
                )}
              </strong>
            </div>

            <div>
              <span>
                Transaction ID
              </span>

              <strong>
                {transfer.transactionId}
              </strong>
            </div>

            <div>
              <span>
                Reference Number
              </span>

              <strong
                data-testid="reference-number"
              >
                {referenceNumber}
              </strong>
            </div>

          </div>

          <div className="success-actions">

            <button
              type="button"
              className="transfer-primary-button"
              data-testid="go-to-dashboard"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Go to Dashboard
            </button>

            <button
              type="button"
              className="transfer-secondary-button"
              data-testid="view-transactions"
              onClick={() =>
                navigate("/transactions")
              }
            >
              View Transactions
            </button>

          </div>

          <div className="success-security">
            🔒 Securely processed by NH Digital Bank
          </div>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * CONFIRMATION PAGE
   * ============================================================
   */

  return (
    <div
      className="transfer-confirmation-page"
      data-testid="transfer-confirmation-page"
    >
      <div className="confirmation-container">

        {/* HEADER */}

        <header className="confirmation-header">

          <div>

            <button
              type="button"
              className="confirmation-back"
              data-testid="back-to-transfer"
              onClick={() =>
                navigate("/transfers")
              }
              disabled={confirming}
            >
              ← Back to Transfer
            </button>

            <h1>
              Confirm Transfer
            </h1>

            <p>
              Review the details and
              authorize your payment.
            </p>

          </div>

          <div className="confirmation-secure-badge">
            🔒 Secure Transaction
          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div
            className="confirmation-error"
            data-testid="transfer-error"
            role="alert"
          >
            <div className="confirmation-error-icon">
              !
            </div>

            <div>
              <strong>
                Action required
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* TRANSFER SUMMARY */}

        <section
          className="confirmation-card"
          data-testid="transfer-summary"
        >

          <div className="confirmation-card-header">

            <div>
              <h2>
                Transfer Summary
              </h2>

              <p>
                Transaction #
                {" "}
                {transfer.transactionId}
              </p>
            </div>

            <span className="pending-status">
              Awaiting Authorization
            </span>

          </div>

          <div className="confirmation-route">

            <div className="confirmation-party">

              <span className="party-label">
                FROM
              </span>

              <div className="party-content">

                <div className="party-icon">
                  ₹
                </div>

                <div>
                  <strong>
                    {
                      transfer.senderAccount
                        .account_type ||
                      "Bank Account"
                    }
                  </strong>

                  <span>
                    {maskAccount(
                      transfer.senderAccount
                        .account_number
                    )}
                  </span>
                </div>

              </div>

            </div>

            <div className="confirmation-arrow">
              →
            </div>

            <div className="confirmation-party">

              <span className="party-label">
                TO
              </span>

              <div className="party-content">

                <div className="party-icon beneficiary">
                  👤
                </div>

                <div>
                  <strong>
                    {
                      transfer.beneficiary
                        .beneficiary_name
                    }
                  </strong>

                  <span>
                    {maskAccount(
                      transfer.beneficiary
                        .account_number
                    )}
                  </span>

                  <small>
                    {
                      transfer.beneficiary
                        .bank_name
                    }
                  </small>
                </div>

              </div>

            </div>

          </div>

          <div className="confirmation-amount">

            <span>
              Transfer Amount
            </span>

            <strong
              data-testid="confirmation-amount"
            >
              {formatCurrency(
                transfer.amount
              )}
            </strong>

          </div>

          {transfer.remarks && (
            <div className="confirmation-remarks">

              <span>
                Remarks
              </span>

              <p>
                {transfer.remarks}
              </p>

            </div>
          )}

        </section>

        {/* SECURITY VERIFICATION */}

        <section className="confirmation-card">

          <div className="confirmation-card-header">

            <div>
              <h2>
                Security Verification
              </h2>

              <p>
                Authorize this transaction
                using your PIN and OTP.
              </p>
            </div>

          </div>

          <form
            className="confirmation-form"
            data-testid="transfer-confirmation-form"
            onSubmit={handleSubmit}
          >

            {/* TRANSACTION PIN */}

            <div className="confirmation-field">

              <label htmlFor="transaction-pin">
                Transaction PIN
              </label>

              <span className="field-description">
                Enter your 6-digit transaction PIN.
              </span>

              <input
                id="transaction-pin"
                data-testid="transaction-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={transactionPin}
                onChange={(event) => {
                  const value =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setTransactionPin(
                    value.slice(0, 6)
                  );

                  setError("");
                }}
                placeholder="••••••"
                disabled={confirming}
              />

              <div className="field-footer">
                <span>
                  {transactionPin.length}/6 digits
                </span>

                <span>
                  🔒 Protected
                </span>
              </div>

            </div>

            {/* OTP */}

            <div className="confirmation-field">

              <div className="otp-label-row">

                <div>
                  <label htmlFor="otp-input">
                    One-Time Password
                  </label>

                  <span className="field-description">
                    Enter the OTP generated for
                    this transaction.
                  </span>
                </div>

                <button
                  type="button"
                  className="otp-generate-button"
                  data-testid="generate-otp-button"
                  onClick={
                    handleGenerateOtp
                  }
                  disabled={
                    generatingOtp ||
                    confirming
                  }
                >
                  {generatingOtp
                    ? "Generating..."
                    : otpGenerated &&
                      remainingSeconds > 0
                    ? "Resend OTP"
                    : "Generate OTP"}
                </button>

              </div>
{/* ADD OTP DISPLAY HERE */}

{otpGenerated && generatedOtp && (
  <div
    className="alert alert-success mt-3"
    data-testid="generated-otp"
  >
    <strong>OTP generated successfully</strong>

    <div className="mt-2">
      Development OTP:{" "}
      <strong>{generatedOtp}</strong>
    </div>

    <div className="small mt-1">
      Use this OTP to complete the transfer.
    </div>
  </div>
)}
              <input
                id="otp-input"
                data-testid="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  const value =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setOtp(
                    value.slice(0, 6)
                  );

                  setError("");
                }}
                placeholder="Enter 6-digit OTP"
                disabled={
                  !otpGenerated ||
                  confirming
                }
              />

              <div className="field-footer">

                <span>
                  {otp.length}/6 digits
                </span>

                {otpGenerated && (
                  <strong
                    className={
                      remainingSeconds > 0
                        ? "otp-active"
                        : "otp-expired"
                    }
                    data-testid="otp-status"
                  >
                    {remainingSeconds > 0
                      ? `Expires in ${otpTimer}`
                      : "OTP expired"}
                  </strong>
                )}

              </div>

            </div>

            {/* SECURITY NOTICE */}

            <div
              className="confirmation-security-notice"
              data-testid="transfer-security-notice"
            >
              <div className="notice-icon">
                🛡️
              </div>

              <div>
                <strong>
                  Never share your PIN or OTP
                </strong>

                <p>
                  NH Digital Bank will never
                  ask you to share your
                  transaction PIN or OTP.
                </p>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="confirmation-actions">

              <button
                type="button"
                className="transfer-secondary-button"
                data-testid="cancel-confirmation"
                onClick={() =>
                  navigate("/transfers")
                }
                disabled={confirming}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="transfer-primary-button confirmation-submit"
                data-testid="confirm-transfer-button"
                disabled={
                  confirming ||
                  transactionPin.length !== 6 ||
                  otp.length !== 6 ||
                  !otpGenerated ||
                  remainingSeconds <= 0
                }
              >
                {confirming ? (
                  <>
                    <span className="button-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm & Transfer
                    <span>→</span>
                  </>
                )}
              </button>

            </div>

          </form>

        </section>

        <div className="confirmation-footer">
          <span>🔒</span>
          <span>
            Your transaction is protected by
            NH Digital Bank security controls.
          </span>
        </div>

      </div>
    </div>
  );
}