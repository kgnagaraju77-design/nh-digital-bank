import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getTransactions,
  type Transaction,
} from "../services/transactionService";

import "./Transactions.css";

export default function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  /*
   * ============================================================
   * LOAD TRANSACTIONS
   * ============================================================
   */

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const response =
        await getTransactions();

      if (!response.success) {
        throw new Error(
          "Unable to load transactions."
        );
      }

      setTransactions(
        response.data.transactions || []
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * ACCOUNT MASKING
   * ============================================================
   */

  function maskAccount(
    accountNumber: string
  ) {
    if (!accountNumber) {
      return "•••• ••••";
    }

    if (accountNumber.length <= 4) {
      return `•••• ${accountNumber}`;
    }

    return `•••• •••• ${accountNumber.slice(-4)}`;
  }

  /*
   * ============================================================
   * CURRENCY
   * ============================================================
   */

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

  /*
   * ============================================================
   * DATE
   * ============================================================
   */

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

  /*
   * ============================================================
   * NORMALIZE SEARCH VALUE
   * ============================================================
   */

  function normalize(value: unknown) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[\s-]/g, "");
  }

  /*
   * ============================================================
   * SEARCH + FILTER
   * ============================================================
   */

  const filteredTransactions =
    useMemo(() => {
      const normalizedQuery =
        normalize(search);

      return transactions.filter(
        (transaction) => {
          let matchesSearch = true;

          if (normalizedQuery) {
            const transactionId =
              normalize(transaction.id);

            const reference =
              normalize(
                transaction.transaction_reference
              );

            const senderAccount =
              normalize(
                transaction.sender_account_number
              );

            const receiverAccount =
              normalize(
                transaction.receiver_account_number
              );

            const remarks =
              normalize(transaction.remarks);

            const transactionType =
              normalize(
                transaction.transaction_type
              );

            const status =
              normalize(transaction.status);

            /*
             * Numeric search
             *
             * Supports:
             * Transaction ID
             * Account number
             * Amount
             */
            if (
              /^\d+(\.\d+)?$/.test(
                normalizedQuery
              )
            ) {
              const searchNumber =
                Number(normalizedQuery);

              const transactionAmount =
                Number(transaction.amount);

              matchesSearch =
                transactionId ===
                  normalizedQuery ||
                senderAccount.includes(
                  normalizedQuery
                ) ||
                receiverAccount.includes(
                  normalizedQuery
                ) ||
                transactionAmount ===
                  searchNumber;
            } else {
              /*
               * Text search
               *
               * Supports:
               * Reference
               * Remarks
               * Transaction type
               * Status
               */
              matchesSearch =
                reference.includes(
                  normalizedQuery
                ) ||
                remarks.includes(
                  normalizedQuery
                ) ||
                transactionType.includes(
                  normalizedQuery
                ) ||
                status.includes(
                  normalizedQuery
                );
            }
          }

          const matchesStatus =
            statusFilter === "ALL" ||
            normalize(
              transaction.status
            ) ===
              normalize(statusFilter);

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      transactions,
      search,
      statusFilter,
    ]);

  /*
   * ============================================================
   * OPEN TRANSACTION DETAILS
   * ============================================================
   */

  function openTransactionDetails(
    transactionId: number
  ) {
    navigate(
      `/transactions/${transactionId}`
    );
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div
        className="transactions-page"
        data-testid="transactions-page"
      >
        <div
          className="transactions-loading"
          data-testid="transactions-loading"
        >
          Loading transactions...
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div
      className="transactions-page"
      data-testid="transactions-page"
    >
      <div className="transactions-container">

        {/* HEADER */}

        <div className="transactions-header">
          <div>
            <h1>
              Transactions
            </h1>

            <p>
              View and manage your
              transaction history.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            data-testid="refresh-transactions"
            onClick={loadTransactions}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="transactions-error"
            data-testid="transactions-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* FILTERS */}

        <section
          className="transactions-filters"
          data-testid="transactions-filters"
        >
          <div className="search-wrapper">

            <input
              type="search"
              placeholder="Search transaction..."
              value={search}
              data-testid="transaction-search"
              aria-label="Search transactions"
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <select
            value={statusFilter}
            data-testid="transaction-status-filter"
            aria-label="Filter transactions by status"
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="SUCCESS">
              Success
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="FAILED">
              Failed
            </option>
          </select>
        </section>

        {/* COUNT */}

        <div
          className="transaction-count"
          data-testid="transaction-count"
        >
          Showing{" "}
          <strong>
            {filteredTransactions.length}
          </strong>{" "}
          transaction
          {filteredTransactions.length !==
          1
            ? "s"
            : ""}
        </div>

        {/* EMPTY */}

        {filteredTransactions.length ===
          0 && (
          <div
            className="transactions-empty"
            data-testid="transactions-empty"
          >
            <div className="empty-icon">
              ↔
            </div>

            <h2>
              No transactions found
            </h2>

            <p>
              Try changing your search
              or filter.
            </p>
          </div>
        )}

        {/* TRANSACTION LIST */}

        {filteredTransactions.length >
          0 && (
          <div
            className="transactions-list"
            data-testid="transactions-list"
          >
            {filteredTransactions.map(
              (transaction) => (
                <article
                  key={transaction.id}
                  className="transaction-card"
                  data-testid={`transaction-${transaction.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View transaction ${transaction.id}`}
                  onClick={() =>
                    openTransactionDetails(
                      transaction.id
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();

                      openTransactionDetails(
                        transaction.id
                      );
                    }
                  }}
                >

                  {/* MAIN */}

                  <div className="transaction-main">

                    <div
                      className="transaction-icon"
                      aria-hidden="true"
                    >
                      ↗
                    </div>

                    <div className="transaction-info">

                      <div className="transaction-title-row">

                        <h2>
                          {transaction.transaction_type ===
                          "FUND_TRANSFER"
                            ? "Fund Transfer"
                            : transaction.transaction_type}
                        </h2>

                        <span
                          className={`transaction-status status-${String(
                            transaction.status
                          ).toLowerCase()}`}
                          data-testid={`transaction-status-${transaction.id}`}
                        >
                          {transaction.status}
                        </span>

                      </div>

                      <p>
                        To{" "}
                        <strong>
                          {maskAccount(
                            transaction.receiver_account_number
                          )}
                        </strong>
                      </p>

                      <span className="transaction-reference">
                        {transaction.transaction_reference}
                      </span>

                    </div>

                    <div className="transaction-amount">

                      <strong>
                        -{" "}
                        {formatCurrency(
                          transaction.amount
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          transaction.created_at
                        )}
                      </span>

                    </div>

                  </div>

                  {/* FOOTER */}

                  <div className="transaction-footer">

                    <span>
                      Transaction ID:{" "}
                      <strong>
                        {transaction.id}
                      </strong>
                    </span>

                    {transaction.remarks && (
                      <span>
                        Remarks:{" "}
                        {transaction.remarks}
                      </span>
                    )}

                    <span className="transaction-view-details">
                      View Details →
                    </span>

                  </div>

                </article>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
}