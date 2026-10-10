import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getTransactionById,
  type Transaction,
} from "../services/transactionService";

import "./TransactionDetails.css";
import { downloadTransactionReceipt } from "../utils/transactionReceipt";

export default function TransactionDetails() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!transactionId) {
      setError("Transaction ID is missing.");
      setLoading(false);
      return;
    }

    loadTransaction(
      Number(transactionId)
    );
  }, [transactionId]);

  async function loadTransaction(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      setError("Invalid transaction ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getTransactionById(id);

      if (!response.success) {
        throw new Error(
          "Unable to load transaction."
        );
      }

      setTransaction(
        response.data.transaction
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load transaction details."
      );
    } finally {
      setLoading(false);
    }
  }

  function maskAccount(
    accountNumber?: string
  ) {
    if (!accountNumber) {
      return "•••• ••••";
    }

    if (accountNumber.length <= 4) {
      return `•••• ${accountNumber}`;
    }

    return `•••• •••• ${accountNumber.slice(-4)}`;
  }

  function formatCurrency(
    value: string | number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(Number(value));
  }

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(value));
  }
function handleDownloadReceipt() {
  if (!transaction) {
    return;
  }

  downloadTransactionReceipt(transaction);
}

  function getStatusClass(
    status?: string
  ) {
    return `details-status status-${String(
      status
    ).toLowerCase()}`;
  }

  if (loading) {
    return (
      <div
        className="transaction-details-page"
        data-testid="transaction-details-page"
      >
        <div
          className="transaction-details-loading"
          data-testid="transaction-details-loading"
        >
          Loading transaction details...
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div
        className="transaction-details-page"
        data-testid="transaction-details-page"
      >
        <div
          className="transaction-details-error"
          data-testid="transaction-details-error"
        >
          <div className="details-error-icon">
            !
          </div>

          <h2>
            Unable to load transaction
          </h2>

          <p>
            {error ||
              "Transaction not found."}
          </p>

          <button
            type="button"
            className="details-secondary-button"
            data-testid="back-to-transactions"
            onClick={() =>
              navigate("/transactions")
            }
          >
            ← Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="transaction-details-page"
      data-testid="transaction-details-page"
    >
      <div className="transaction-details-container">

        {/* HEADER */}

        <div className="details-header">

          <div>
            <button
              type="button"
              className="details-back-button"
              data-testid="back-to-transactions"
              onClick={() =>
                navigate("/transactions")
              }
            >
              ← Back to Transactions
            </button>

            <h1>
              Transaction Details
            </h1>

            <p>
              View complete information
              about your transaction.
            </p>
          </div>

          <span
            className={getStatusClass(
              transaction.status
            )}
            data-testid="transaction-details-status"
          >
            {transaction.status}
          </span>

        </div>

        {/* AMOUNT CARD */}

        <section
          className="details-amount-card"
          data-testid="transaction-amount-card"
        >
          <span>
            Transfer Amount
          </span>

          <strong
            data-testid="transaction-detail-amount"
          >
            {formatCurrency(
              transaction.amount
            )}
          </strong>

          <small>
            {transaction.transaction_type.replace(
              "_",
              " "
            )}
          </small>
        </section>

        {/* TRANSACTION INFORMATION */}

        <section
          className="details-card"
          data-testid="transaction-information"
        >
          <div className="details-card-header">
            <div>
              <h2>
                Transaction Information
              </h2>

              <p>
                Reference and transaction
                identifiers
              </p>
            </div>
          </div>

          <div className="details-grid">

            <div className="detail-item">
              <span>
                Transaction ID
              </span>

              <strong
                data-testid="transaction-detail-id"
              >
                {transaction.id}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Reference Number
              </span>

              <strong
                data-testid="transaction-detail-reference"
              >
                {transaction.transaction_reference}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Transaction Type
              </span>

              <strong>
                {transaction.transaction_type.replace(
                  "_",
                  " "
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Status
              </span>

              <strong>
                {transaction.status}
              </strong>
            </div>

          </div>
        </section>

        {/* TRANSFER ROUTE */}

        <section
          className="details-card"
          data-testid="transaction-route"
        >
          <div className="details-card-header">
            <div>
              <h2>
                Transfer Details
              </h2>

              <p>
                Sender and beneficiary
                information
              </p>
            </div>
          </div>

          <div className="transfer-route">

            <div className="route-party">

              <span className="route-label">
                FROM
              </span>

              <div className="route-content">

                <div className="route-icon">
                  ₹
                </div>

                <div>
                  <strong>
                    Sender Account
                  </strong>

                  <span>
                    {maskAccount(
                      transaction.sender_account_number
                    )}
                  </span>
                </div>

              </div>

            </div>

            <div className="route-arrow">
              →
            </div>

            <div className="route-party">

              <span className="route-label">
                TO
              </span>

              <div className="route-content">

                <div className="route-icon beneficiary">
                  👤
                </div>

                <div>
                  <strong>
                    {transaction.beneficiary_name ||
                      "Beneficiary"}
                  </strong>

                  <span>
                    {maskAccount(
                      transaction.receiver_account_number
                    )}
                  </span>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* DATE / REMARKS */}

        <section
          className="details-card"
          data-testid="transaction-meta"
        >
          <div className="details-grid">

            <div className="detail-item">
              <span>
                Transaction Date
              </span>

              <strong>
                {formatDate(
                  transaction.created_at
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Last Updated
              </span>

              <strong>
                {formatDate(
                  transaction.updated_at
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Beneficiary ID
              </span>

              <strong>
                {transaction.beneficiary_id ??
                  "—"}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Remarks
              </span>

              <strong>
                {transaction.remarks ||
                  "—"}
              </strong>
            </div>

          </div>
        </section>

        {/* SECURITY */}

        <div
          className="details-security"
          data-testid="transaction-security-notice"
        >
          <span>🔒</span>

          <div>
            <strong>
              Secure Transaction
            </strong>

            <p>
              Your transaction details
              are protected by NH Digital
              Bank security controls.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
{/* ACTIONS */}

<div className="details-actions">

  <button
    type="button"
    className="details-secondary-button"
    data-testid="back-to-transactions-bottom"
    onClick={() =>
      navigate("/transactions")
    }
  >
    ← Back to Transactions
  </button>

  <button
    type="button"
    className="details-primary-button"
    data-testid="download-receipt"
    onClick={handleDownloadReceipt}
  >
    Download Receipt
  </button>

</div>

      </div>
    </div>
  );
}