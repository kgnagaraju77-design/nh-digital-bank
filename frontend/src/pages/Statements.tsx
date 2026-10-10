import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";

import {
  getAccountStatement,
  type StatementTransaction,
} from "../services/statementService";

import {
  getAccounts,
  type Account,
} from "../services/accountService";

import "./Statements.css";

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function maskAccount(accountNumber: string): string {
  const value = String(accountNumber || "").replace(/\D/g, "");

  if (value.length <= 4) {
    return `•••• ${value}`;
  }

  return `•••• •••• ${value.slice(-4)}`;
}

function formatCurrency(value: string | number): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "₹0.00";
  }

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTransactionType(value?: string): string {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getAccountLabel(account: Account): string {
  return `${account.account_type} ${maskAccount(
    account.account_number
  )}`;
}

function getSearchableDateValues(value: string): string[] {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return [];
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  const monthShort = new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(date);

  const monthLong = new Intl.DateTimeFormat("en-IN", {
    month: "long",
  }).format(date);

  return [
    `${day}${month}${year}`,
    `${day}/${month}/${year}`,
    `${day}-${month}-${year}`,
    `${day} ${monthShort} ${year}`,
    `${day} ${monthLong} ${year}`,
    year,
    month,
    day,
  ].map(normalize);
}

export default function Statements() {
  const navigate = useNavigate();

  // ------------------------------------------------------------
  // Accounts
  // ------------------------------------------------------------

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [selectedAccountId, setSelectedAccountId] =
    useState<number | null>(null);

  const [accountsLoading, setAccountsLoading] =
    useState(true);

  // ------------------------------------------------------------
  // Statement
  // ------------------------------------------------------------

  const [account, setAccount] = useState<{
    accountId: number;
    accountNumber: string;
    accountType: string;
    currency: string;
    status: string;
    currentBalance: number;
  } | null>(null);

  const [transactions, setTransactions] =
    useState<StatementTransaction[]>([]);

  const [totalDebits, setTotalDebits] = useState(0);

  const [totalCredits, setTotalCredits] = useState(0);

  const [transactionCount, setTransactionCount] =
    useState(0);

  // ------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [totalPages, setTotalPages] = useState(1);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [hasPreviousPage, setHasPreviousPage] =
    useState(false);

  // ------------------------------------------------------------
  // Date filters
  // ------------------------------------------------------------

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  // ------------------------------------------------------------
  // Search / filters
  // ------------------------------------------------------------

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [directionFilter, setDirectionFilter] =
    useState("ALL");

  // ------------------------------------------------------------
  // UI state
  // ------------------------------------------------------------

  const [loading, setLoading] = useState(false);
   // ==============================================
  // TODAY'S DATE
  // ==============================================

  const todayDate = getTodayDate();

  console.log(
    "Today:",
    todayDate
  );

  const [error, setError] = useState("");

  
  function handleDownloadPDF() {
  if (!account) {
    setError("Please select an account first.");
    return;
  }

  if (filteredTransactions.length === 0) {
    setError("There are no transactions available to download.");
    return;
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();

  
  

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("NH DIGITAL BANK", 20, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Secure. Simple. Smart.", 20, 29);

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT STATEMENT", 20, 43);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    20,
    50
  );

  // Account information
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Account Information", 20, 64);

  doc.setFont("helvetica", "normal");

  doc.text(
    `Account Type: ${account.accountType}`,
    20,
    72
  );

  doc.text(
    `Account Number: XXXX XXXX ${account.accountNumber.slice(-4)}`,
    20,
    79
  );

  doc.text(
    `Status: ${account.status}`,
    20,
    86
  );

  doc.text(
    `Currency: ${account.currency}`,
    20,
    93
  );

  // Statement period
  doc.setFont("helvetica", "bold");
  doc.text("Statement Period", 110, 64);

  doc.setFont("helvetica", "normal");

  doc.text(
    `From: ${fromDate || "All available"}`,
    110,
    72
  );

  doc.text(
    `To: ${toDate || "All available"}`,
    110,
    79
  );

  // Summary
  doc.setFont("helvetica", "bold");
  doc.text("Statement Summary", 20, 108);

  doc.setFont("helvetica", "normal");

  doc.text(
    `Total Credits: ${formatCurrency(totalCredits)}`,
    20,
    116
  );

  doc.text(
    `Total Debits: ${formatCurrency(totalDebits)}`,
    20,
    123
  );

  doc.text(
    `Total Transactions: ${transactionCount}`,
    20,
    130
  );

  doc.text(
    `Current Balance: ${formatCurrency(account.currentBalance)}`,
    110,
    116
  );

  // Transactions
  const rows = filteredTransactions.map(
    (transaction) => {
      const isDebit =
        normalize(
          transaction.transaction_direction
        ) === "debit";

      return [
        formatShortDate(
          transaction.created_at
        ),
        formatTransactionType(
          transaction.transaction_type
        ),
        transaction.transaction_reference,
        isDebit ? "DEBIT" : "CREDIT",
        `${isDebit ? "-" : "+"}${formatCurrency(
          transaction.amount
        )}`,
        transaction.status,
      ];
    }
  );

  autoTable(doc, {
    startY: 142,
    head: [
      [
        "Date",
        "Type",
        "Reference",
        "Direction",
        "Amount",
        "Status",
      ],
    ],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 3,
    },
    headStyles: {
      fontSize: 7,
      fontStyle: "bold",
    },
  });

  const finalY =
    (doc as any).lastAutoTable?.finalY || 150;

  // Security notice
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.text(
    "Security Notice",
    20,
    finalY + 15
  );

  doc.setFont("helvetica", "normal");

  doc.text(
    "This statement is electronically generated by NH Digital Bank.",
    20,
    finalY + 22
  );

  doc.text(
    "Please keep this document secure and do not share confidential account information.",
    20,
    finalY + 28
  );

  // Footer
  doc.setFontSize(7);

  doc.text(
    "NH Digital Bank | Secure. Simple. Smart.",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  const safeAccount =
    account.accountNumber.slice(-4);

  const safeFrom =
    fromDate || "all";

  const safeTo =
    toDate || "all";

  doc.save(
    `NH-Digital-Bank-Statement-${safeAccount}-${safeFrom}-${safeTo}.pdf`
  );
}

function handleDownloadCSV() {
  if (!account) {
    setError("Please select an account first.");
    return;
  }

  if (filteredTransactions.length === 0) {
    setError("There are no transactions available to download.");
    return;
  }

  const headers = [
    "Date",
    "Transaction ID",
    "Transaction Reference",
    "Transaction Type",
    "Direction",
    "Amount",
    "Status",
    "Receiver Account",
    "Remarks",
  ];

  const rows = filteredTransactions.map(
    (transaction) => {
      const isDebit =
        normalize(
          transaction.transaction_direction
        ) === "debit";

      return [
        formatDate(transaction.created_at),
        transaction.id,
        transaction.transaction_reference,
        formatTransactionType(
          transaction.transaction_type
        ),
        isDebit ? "DEBIT" : "CREDIT",
        Number(transaction.amount).toFixed(2),
        transaction.status,
        `XXXX XXXX ${transaction.receiver_account_number.slice(
          -4
        )}`,
        transaction.remarks || "",
      ];
    }
  );

  const escapeCSV = (
    value: unknown
  ): string => {
    const text = String(value ?? "");

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      row.map(escapeCSV).join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  const safeAccount =
    account.accountNumber.slice(-4);

  link.download =
    `NH-Digital-Bank-Statement-${safeAccount}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

  // ------------------------------------------------------------
  // Load accounts
  // ------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        setAccountsLoading(true);
        setError("");

        const response = await getAccounts();

        if (!mounted) {
          return;
        }

        const userAccounts =
          response.data?.accounts || [];

        setAccounts(userAccounts);

        if (userAccounts.length > 0) {
          setSelectedAccountId(
            userAccounts[0].id
          );
        }
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        if (err?.response?.status === 401) {
          localStorage.removeItem("nh_token");
          localStorage.removeItem("nh_user");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load your accounts."
        );
      } finally {
        if (mounted) {
          setAccountsLoading(false);
        }
      }




      
    }

    loadAccounts();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ------------------------------------------------------------
  // Load statement
  // ------------------------------------------------------------

  const loadStatement = useCallback(
    async (
      requestedPage = 1,
      requestedAccountId = selectedAccountId,
      requestedFromDate = fromDate,
      requestedToDate = toDate
    ) => {
      if (!requestedAccountId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getAccountStatement({
            accountId: requestedAccountId,
            from:
              requestedFromDate || undefined,
            to:
              requestedToDate || undefined,
            page: requestedPage,
            limit,
          });

        setAccount(response.data.account);

        setTransactions(
          response.data.transactions || []
        );

        setTotalDebits(
          response.data.summary?.totalDebits || 0
        );

        setTotalCredits(
          response.data.summary?.totalCredits || 0
        );

        setTransactionCount(
          response.data.summary?.transactionCount || 0
        );

        setPage(
          response.data.pagination?.page ||
            requestedPage
        );

        setTotalPages(
          response.data.pagination?.totalPages ||
            1
        );

        setHasNextPage(
          response.data.pagination?.hasNextPage ||
            false
        );

        setHasPreviousPage(
          response.data.pagination
            ?.hasPreviousPage || false
        );
      } catch (err: any) {
        if (err?.response?.status === 401) {
          localStorage.removeItem("nh_token");
          localStorage.removeItem("nh_user");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load your account statement."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      selectedAccountId,
      fromDate,
      toDate,
      limit,
      navigate,
    ]
  );

  // ------------------------------------------------------------
  // Load first statement when account is selected
  // ------------------------------------------------------------

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }

    loadStatement(
      1,
      selectedAccountId,
      fromDate,
      toDate
    );
  }, [
    selectedAccountId,
    loadStatement,
  ]);

  // ------------------------------------------------------------
  // Generate statement
  // ------------------------------------------------------------

  function handleGenerateStatement() {
  if (!selectedAccountId) {
    setError(
      "Please select an account."
    );
    return;
  }

  // Future From Date
  if (
    fromDate &&
    fromDate > todayDate
  ) {
    setError(
      "From date cannot be a future date."
    );
    return;
  }

  // Future To Date
  if (
    toDate &&
    toDate > todayDate
  ) {
    setError(
      "To date cannot be a future date."
    );
    return;
  }

  // Invalid date range
  if (
    fromDate &&
    toDate &&
    fromDate > toDate
  ) {
    setError(
      "From date cannot be later than To date."
    );
    return;
  }

  setError("");

  setPage(1);

  loadStatement(
    1,
    selectedAccountId,
    fromDate,
    toDate
  );
}
  // ------------------------------------------------------------
  // Account change
  // ------------------------------------------------------------

  function handleAccountChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const accountId = Number(
      event.target.value
    );

    if (!accountId) {
      return;
    }

    setSelectedAccountId(accountId);

    setPage(1);

    setSearch("");

    setStatusFilter("ALL");

    setDirectionFilter("ALL");
  }

  // ------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------

  function handlePreviousPage() {
    if (
      !hasPreviousPage ||
      page <= 1 ||
      !selectedAccountId
    ) {
      return;
    }

    loadStatement(
      page - 1,
      selectedAccountId,
      fromDate,
      toDate
    );
  }

  function handleNextPage() {
    if (
      !hasNextPage ||
      page >= totalPages ||
      !selectedAccountId
    ) {
      return;
    }

    loadStatement(
      page + 1,
      selectedAccountId,
      fromDate,
      toDate
    );
  }

  function handlePageChange(
    requestedPage: number
  ) {
    if (
      requestedPage === page ||
      !selectedAccountId
    ) {
      return;
    }

    loadStatement(
      requestedPage,
      selectedAccountId,
      fromDate,
      toDate
    );
  }

  // ------------------------------------------------------------
  // Search and filtering
  // ------------------------------------------------------------

  const filteredTransactions = useMemo(() => {
    const normalizedSearch =
      normalize(search);

    return transactions.filter(
      (transaction) => {
        const searchableDates =
          getSearchableDateValues(
            transaction.created_at
          );

        const matchesSearch =
          !normalizedSearch ||
          normalize(transaction.id).includes(
            normalizedSearch
          ) ||
          normalize(
            transaction.transaction_reference
          ).includes(normalizedSearch) ||
          normalize(
            transaction.receiver_account_number
          ).includes(normalizedSearch) ||
          normalize(transaction.amount).includes(
            normalizedSearch
          ) ||
          normalize(
            transaction.transaction_type
          ).includes(normalizedSearch) ||
          normalize(transaction.remarks).includes(
            normalizedSearch
          ) ||
          searchableDates.some((date) =>
            date.includes(normalizedSearch)
          );

        const matchesStatus =
          statusFilter === "ALL" ||
          normalize(transaction.status) ===
            normalize(statusFilter);

        const matchesDirection =
          directionFilter === "ALL" ||
          normalize(
            transaction.transaction_direction
          ) === normalize(directionFilter);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDirection
        );
      }
    );
  }, [
    transactions,
    search,
    statusFilter,
    directionFilter,
  ]);

  // ------------------------------------------------------------
  // Page numbers
  // ------------------------------------------------------------

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    for (
      let i = 1;
      i <= totalPages;
      i += 1
    ) {
      pages.push(i);
    }

    return pages;
  }, [totalPages]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <AppShell>
      <div
        className="statements-page"
        data-testid="statement-page"
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="statements-header">
          <div>
            <h1>Statements</h1>

            <p>
              View and manage your account
              transaction statements securely.
            </p>
          </div>

          <button
            type="button"
            className="statement-refresh-button"
            data-testid="statement-refresh"
            onClick={() =>
              loadStatement(
                1,
                selectedAccountId,
                fromDate,
                toDate
              )
            }
            disabled={
              loading ||
              accountsLoading ||
              !selectedAccountId
            }
          >
            ↻ Refresh
          </button>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="statement-error"
            data-testid="statement-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="statement-filter-card">
          <div className="statement-filter-header">
            <div>
              <h2>Generate Statement</h2>

              <p>
                Select an account and statement
                period.
              </p>
            </div>
          </div>

          <div className="statement-filter-grid">
            {/* Account */}

            <div className="statement-field">
              <label
                htmlFor="statement-account-select"
              >
                Account
              </label>

              <select
                id="statement-account-select"
                data-testid="statement-account-select"
                value={
                  selectedAccountId ?? ""
                }
                onChange={
                  handleAccountChange
                }
                disabled={
                  accountsLoading ||
                  loading
                }
              >
                <option value="" disabled>
                  {accountsLoading
                    ? "Loading accounts..."
                    : "Select account"}
                </option>

                {accounts.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {getAccountLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            {/* From */}
<div className="statement-field">
  <label htmlFor="statement-from-date">
    From Date
  </label>

  <input
    id="statement-from-date"
    data-testid="statement-from-date"
    type="date"
    value={fromDate}
    max={todayDate}
    onChange={(event) => {
      const selectedDate = event.target.value;

      if (selectedDate > todayDate) {
        setError(
          "From date cannot be a future date."
        );

        setFromDate("");
        return;
      }

      setError("");
      setFromDate(selectedDate);
    }}
  />
</div>

            {/* To */}

         <div className="statement-field">
  <label htmlFor="statement-to-date">
    To Date
  </label>

  <input
    id="statement-to-date"
    data-testid="statement-to-date"
    type="date"
    value={toDate}
    min={fromDate || undefined}
    max={todayDate}
    onChange={(event) => {
      const selectedDate = event.target.value;

      if (selectedDate > todayDate) {
        setError(
          "To date cannot be a future date."
        );

        setToDate("");
        return;
      }

      if (
        fromDate &&
        selectedDate < fromDate
      ) {
        setError(
          "To date cannot be earlier than From date."
        );

        setToDate("");
        return;
      }

      setError("");
      setToDate(selectedDate);
    }}
  />
</div>

            {/* Generate */}

            <div className="statement-generate-wrapper">
              <button
                type="button"
                className="statement-generate-button"
                data-testid="statement-generate"
                onClick={
                  handleGenerateStatement
                }
                disabled={
                  loading ||
                  !selectedAccountId
                }
              >
                {loading
                  ? "Loading..."
                  : "Generate Statement"}
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            ACCOUNT SUMMARY
        ====================================================== */}

        {account && (
          <section
            className="statement-account-card"
            data-testid="statement-account-summary"
          >
            <div className="statement-account-main">
              <div className="statement-account-icon">
                ₹
              </div>

              <div>
                <span>
                  Selected Account
                </span>

                <strong>
                  {account.accountType}{" "}
                  {maskAccount(
                    account.accountNumber
                  )}
                </strong>

                <small>
                  {account.currency} •{" "}
                  {account.status}
                </small>
              </div>
            </div>

            <div className="statement-account-balance">
              <span>
                Current Balance
              </span>

              <strong
                data-testid="statement-current-balance"
              >
                {formatCurrency(
                  account.currentBalance
                )}
              </strong>
            </div>
          </section>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <section className="statement-summary-grid">
          <div
            className="statement-summary-card"
            data-testid="statement-total-credits"
          >
            <span className="summary-label">
              Total Credits
            </span>

            <strong>
              {formatCurrency(
                totalCredits
              )}
            </strong>

            <small>
              Money received
            </small>
          </div>

          <div
            className="statement-summary-card"
            data-testid="statement-total-debits"
          >
            <span className="summary-label">
              Total Debits
            </span>

            <strong>
              {formatCurrency(
                totalDebits
              )}
            </strong>

            <small>
              Money transferred or spent
            </small>
          </div>

          <div
            className="statement-summary-card"
            data-testid="statement-transaction-count"
          >
            <span className="summary-label">
              Transactions
            </span>

            <strong>
              {transactionCount}
            </strong>

            <small>
              Total statement transactions
            </small>
          </div>
        </section>

        {/* =====================================================
            TRANSACTIONS
        ====================================================== */}

        <section className="statement-table-card">
          <div className="statement-table-header">
            <div>
              <h2>
                Transaction History
              </h2>

              <p>
                {transactionCount} transaction
                {transactionCount === 1
                  ? ""
                  : "s"}{" "}
                found
              </p>
            </div>
          </div>

          {/* Search / Filters */}

          <div className="statement-toolbar">
            <div className="statement-search-wrapper">
              <span className="statement-search-icon">
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search transactions..."
                value={search}
                data-testid="statement-search"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={statusFilter}
              data-testid="statement-status-filter"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter by transaction status"
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

            <select
              value={directionFilter}
              data-testid="statement-direction-filter"
              onChange={(event) =>
                setDirectionFilter(
                  event.target.value
                )
              }
              aria-label="Filter by transaction direction"
            >
              <option value="ALL">
                All Transactions
              </option>

              <option value="DEBIT">
                Debits
              </option>

              <option value="CREDIT">
                Credits
              </option>
            </select>
          </div>

          {/* Loading */}

          {loading && (
            <div
              className="statement-loading"
              data-testid="statement-loading"
            >
              <div className="statement-spinner" />

              <span>
                Loading statement...
              </span>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            filteredTransactions.length ===
              0 && (
              <div
                className="statement-empty"
                data-testid="statement-empty"
              >
                <div className="statement-empty-icon">
                  ⌕
                </div>

                <h3>
                  No transactions found
                </h3>

                <p>
                  Try changing your search,
                  filters, or statement date
                  range.
                </p>
              </div>
            )}

          {/* Table */}

          {!loading &&
            filteredTransactions.length >
              0 && (
              <div className="statement-table-container">
                <table
                  className="statement-table"
                  data-testid="statement-table"
                >
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>
                        Description
                      </th>
                      <th>
                        Reference
                      </th>
                      <th>
                        Direction
                      </th>
                      <th>
                        Amount
                      </th>
                      <th>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map(
                      (transaction) => {
                        const isDebit =
                          normalize(
                            transaction.transaction_direction
                          ) === "debit";

                        return (
                          <tr
                            key={
                              transaction.id
                            }
                            data-testid={`statement-row-${transaction.id}`}
                            onClick={() =>
                              navigate(
                                `/transactions/${transaction.id}`
                              )
                            }
                            tabIndex={0}
                            role="button"
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event.preventDefault();

                                navigate(
                                  `/transactions/${transaction.id}`
                                );
                               } }
                            }
                          >
                          
                            {/* Date */}

                            <td>
                              <div className="statement-date">
                                <strong>
                                  {formatShortDate(
                                    transaction.created_at
                                  )}
                                </strong>

                                <small>
                                  {formatDate(
                                    transaction.created_at
                                  )
                                    .split(
                                      ", "
                                    )
                                    .pop()}
                                </small>
                              </div>
                            </td>

                            {/* Description */}

                            <td>
                              <div className="statement-description">
                                <strong>
                                  {formatTransactionType(
                                    transaction.transaction_type
                                  )}
                                </strong>

                                <small>
                                  {transaction.remarks ||
                                    (isDebit
                                      ? `Transfer to ${maskAccount(
                                          transaction.receiver_account_number
                                        )}`
                                      : "Money received")}
                                </small>
                              </div>
                            </td>

                            {/* Reference */}

                            <td>
                              <span className="statement-reference">
                                {
                                  transaction.transaction_reference
                                }
                              </span>
                            </td>

                            {/* Direction */}

                            <td>
                              <span
                                className={`statement-direction ${
                                  isDebit
                                    ? "debit"
                                    : "credit"
                                }`}
                              >
                                {isDebit
                                  ? "Debit"
                                  : "Credit"}
                              </span>
                            </td>

                            {/* Amount */}

                            <td>
                              <strong
                                className={`statement-amount ${
                                  isDebit
                                    ? "debit"
                                    : "credit"
                                }`}
                              >
                                {isDebit
                                  ? "-"
                                  : "+"}

                                {formatCurrency(
                                  transaction.amount
                                )}
                              </strong>
                            </td>

                            {/* Status */}

                            <td>
                              <span
                                className={`statement-status ${normalize(
                                  transaction.status
                                )}`}
                              >
                                {
                                  transaction.status
                                }
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* =================================================
              PAGINATION
          ================================================== */}

          {!loading &&
            transactionCount > 0 && (
              <div
                className="statement-pagination"
                data-testid="statement-pagination"
              >
                <button
                  type="button"
                  data-testid="statement-previous"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    !hasPreviousPage ||
                    loading
                  }
                >
                  ← Previous
                </button>

                <div className="statement-page-numbers">
                  {pageNumbers.map(
                    (pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={
                          pageNumber === page
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          handlePageChange(
                            pageNumber
                          )
                        }
                        data-testid={`statement-page-${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  data-testid="statement-next"
                  onClick={
                    handleNextPage
                  }
                  disabled={
                    !hasNextPage ||
                    loading
                  }
                >
                  Next →
                </button>
              </div>
            )}
        </section>

        {/* =====================================================
            DOWNLOAD
        ====================================================== */}

        <section className="statement-download-card">
          <div>
            <h2>
              Download Statement
            </h2>

            <p>
              Download your statement for
              your records or future
              reference.
            </p>
          </div>

          <div className="statement-download-actions">
            <button
  type="button"
  className="statement-download-secondary"
  data-testid="statement-download-csv"
  onClick={handleDownloadCSV}
  disabled={
    loading ||
    !account ||
    filteredTransactions.length === 0
  }
>
  Download CSV
</button>

           <button
  type="button"
  className="statement-download-primary"
  data-testid="statement-download-pdf"
  onClick={handleDownloadPDF}
  disabled={
    loading ||
    !account ||
    filteredTransactions.length === 0
  }
>
  Download PDF
</button>
          </div>
        </section>

        {/* =====================================================
            SECURITY
        ====================================================== */}

        <section className="statement-security-notice">
          <div className="security-icon">
            🔒
          </div>

          <div>
            <strong>
              Your statement is protected
            </strong>

            <p>
              Account information and
              transaction details are
              securely retrieved from NH
              Digital Bank.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
