import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./Dashboard.css";


/*
 * ============================================================
 * NH DIGITAL BANK
 * ============================================================
 *
 * Dashboard
 *
 * Responsibilities:
 *
 * - Load authenticated dashboard data
 * - Display total available balance
 * - Display primary account
 * - Display quick banking actions
 * - Display recent transactions
 *
 * Application-level navigation such as:
 *
 * - TopBar
 * - Sidebar
 * - Logout
 *
 * is handled by AppShell.
 *
 * Tagline:
 * Secure. Simple. Smart.
 *
 * ============================================================
 */


/*
 * ============================================================
 * ACCOUNT TYPE
 * ============================================================
 */

interface Account {

  id: number;

  account_number: string;

  account_type: string;

  balance: number;

  status: string;

}


/*
 * ============================================================
 * TRANSACTION TYPE
 * ============================================================
 */

interface Transaction {

  id: number;

  amount: number;

  status: string;

  transaction_type?: string;

  created_at?: string;

}


/*
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

function Dashboard() {

  const navigate =
    useNavigate();


  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [accounts, setAccounts] =
    useState<Account[]>([]);


  const [transactions, setTransactions] =
    useState<Transaction[]>([]);


  const [loading, setLoading] =
    useState<boolean>(true);


  const [error, setError] =
    useState<string>("");


  /*
   * ==========================================================
   * AUTHENTICATED USER
   * ==========================================================
   *
   * User information is stored during login.
   *
   * We safely parse the stored value so malformed local
   * storage data does not crash the Dashboard.
   * ==========================================================
   */

  const getStoredUser = () => {

    try {

      return JSON.parse(
        localStorage.getItem(
          "nh_user"
        ) || "{}"
      );

    } catch {

      return {};

    }

  };


  const user =
    getStoredUser();


  /*
   * ==========================================================
   * LOAD DASHBOARD
   * ==========================================================
   *
   * GET /api/dashboard
   *
   * The dashboard uses authenticated backend data.
   *
   * No financial information is hard-coded.
   * ==========================================================
   */

  useEffect(() => {

    const loadDashboard =
      async () => {

        try {

          setLoading(true);

          setError("");


          /*
           * --------------------------------------------------
           * Authentication token
           * --------------------------------------------------
           */

          const token =
            localStorage.getItem(
              "nh_token"
            );


          if (!token) {

            navigate(
              "/login",
              {
                replace: true
              }
            );

            return;

          }


          /*
           * --------------------------------------------------
           * Dashboard API
           * --------------------------------------------------
           */

          const response =
            await api.get(
              "/dashboard",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          console.log(
            "Dashboard response:",
            response.data
          );


          /*
           * --------------------------------------------------
           * Normalize response
           * --------------------------------------------------
           */

          const data =
            response.data?.data ||
            response.data;


          /*
           * --------------------------------------------------
           * Accounts
           * --------------------------------------------------
           */

          if (
            Array.isArray(
              data?.accounts
            )
          ) {

            setAccounts(
              data.accounts
            );

          } else {

            setAccounts([]);

          }


          /*
           * --------------------------------------------------
           * Transactions
           * --------------------------------------------------
           */

          if (
            Array.isArray(
              data?.transactions
            )
          ) {

            setTransactions(
              data.transactions
            );

          } else {

            setTransactions([]);

          }

        } catch (
          error: any
        ) {

          console.error(
            "Dashboard error:",
            error
          );


          /*
           * ------------------------------------------------
           * Session expired / unauthorized
           * ------------------------------------------------
           */

          if (
            error?.response?.status === 401
          ) {

            localStorage.removeItem(
              "nh_token"
            );

            localStorage.removeItem(
              "nh_user"
            );


            navigate(
              "/login",
              {
                replace: true
              }
            );

            return;

          }


          /*
           * ------------------------------------------------
           * General API error
           * ------------------------------------------------
           */

          setError(
            error?.response?.data?.message ||
            "Unable to load dashboard"
          );

        } finally {

          setLoading(false);

        }

      };


    loadDashboard();

  }, [navigate]);


  /*
   * ==========================================================
   * TOTAL BALANCE
   * ==========================================================
   */

  const totalBalance =
    accounts.reduce(
      (
        total,
        account
      ) => {

        return (
          total +
          Number(
            account.balance || 0
          )
        );

      },
      0
    );


  /*
   * ==========================================================
   * CURRENCY FORMATTER
   * ==========================================================
   */

  const formatCurrency =
    (
      amount: number
    ) => {

      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2
        }
      ).format(
        amount
      );

    };


  /*
   * ==========================================================
   * ACCOUNT NUMBER MASK
   * ==========================================================
   */

  const maskAccountNumber =
    (
      accountNumber: string
    ) => {

      if (
        !accountNumber
      ) {

        return "••••";

      }


      return (
        "•••• •••• " +
        accountNumber.slice(-4)
      );

    };


  /*
   * ==========================================================
   * LOADING STATE
   * ==========================================================
   */

  if (loading) {

    return (

      <div
        className="dashboard-page"
        data-testid="dashboard-page"
      >

        <div
          className="
            d-flex
            justify-content-center
            align-items-center
            py-5
          "
          data-testid="dashboard-loading"
          aria-busy="true"
        >

          <div
            className="text-center"
          >

            <div
              className="spinner-border text-primary"
              role="status"
              aria-label="Loading dashboard"
            />

            <p
              className="mt-3 text-muted"
            >
              Loading your financial overview...
            </p>

          </div>

        </div>

      </div>

    );

  }


  /*
   * ==========================================================
   * DASHBOARD PAGE
   * ==========================================================
   *
   * IMPORTANT:
   *
   * No navbar.
   * No sidebar.
   * No logout button.
   *
   * AppShell provides those components.
   * ==========================================================
   */

  return (

    <div
      className="dashboard-page"
      data-testid="dashboard-page"
    >


      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <section
        className="welcome-section"
        data-testid="dashboard-welcome"
      >

        <h1>

          Welcome back,
          {" "}
          {user?.name || "Customer"}
          {" "}👋

        </h1>


        <p>

          Here's your financial overview.

        </p>

      </section>


      {/* ======================================================
          ERROR MESSAGE
          ====================================================== */}

      {error && (

        <div
          className="alert alert-danger"
          role="alert"
          data-testid="dashboard-error"
        >

          {error}

        </div>

      )}


      {/* ======================================================
          FINANCIAL OVERVIEW
          ====================================================== */}

      <section
        className="row g-4"
        aria-label="Financial overview"
      >


        {/* ====================================================
            TOTAL BALANCE
            ==================================================== */}

        <div
          className="col-lg-6"
        >

          <div
            className="balance-card"
            data-testid="total-balance"
          >

            <small>
              Total Available Balance
            </small>


            <h2>

              {formatCurrency(
                totalBalance
              )}

            </h2>


            <small>

              Across{" "}
              {accounts.length}
              {" "}
              account(s)

            </small>

          </div>

        </div>


        {/* ====================================================
            PRIMARY ACCOUNT
            ==================================================== */}

        <div
          className="col-lg-6"
        >

          <div
            className="account-card"
            data-testid="primary-account"
          >

            <h5>
              Primary Account
            </h5>


            {accounts.length > 0 ? (

              <>

                <strong>
                  {accounts[0].account_type}
                </strong>


                <div
                  className="account-number"
                >

                  Account Number:
                  {" "}
                  {maskAccountNumber(
                    accounts[0].account_number
                  )}

                </div>


                <div
                  className="mt-3"
                >

                  <span
                    className={
                      accounts[0].status === "ACTIVE"
                        ? "badge bg-success"
                        : "badge bg-secondary"
                    }
                  >

                    {accounts[0].status}

                  </span>

                </div>

              </>

            ) : (

              <div
                className="text-muted mt-3"
              >

                <p className="mb-2">

                  No accounts available.

                </p>


                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  data-testid="view-accounts-button"
                  onClick={() =>
                    navigate("/accounts")
                  }
                >

                  View Accounts

                </button>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          QUICK ACTIONS
          ====================================================== */}

      <section
        className="mt-5"
        data-testid="quick-actions"
      >

        <div
          className="
            d-flex
            justify-content-between
            align-items-center
            mb-3
          "
        >

          <h2
            className="h5 mb-0"
          >
            Quick Actions
          </h2>

        </div>


        <div
          className="row g-3"
        >


          {/* ==================================================
              SEND MONEY
              ================================================== */}

          <div
            className="col-6 col-md-3"
          >

            <button
              type="button"
              className="quick-card w-100 border-0"
              data-testid="quick-transfer"
              onClick={() =>
                navigate("/transfers")
              }
            >

              <span
                className="fs-3"
                aria-hidden="true"
              >
                💸
              </span>


              <div
                className="mt-2"
              >
                Send Money
              </div>

            </button>

          </div>


          {/* ==================================================
              BENEFICIARIES
              ================================================== */}

          <div
            className="col-6 col-md-3"
          >

            <button
              type="button"
              className="quick-card w-100 border-0"
              data-testid="quick-beneficiary"
              onClick={() =>
                navigate("/beneficiaries")
              }
            >

              <span
                className="fs-3"
                aria-hidden="true"
              >
                👥
              </span>


              <div
                className="mt-2"
              >
                Beneficiaries
              </div>

            </button>

          </div>


          {/* ==================================================
              TRANSACTIONS
              ================================================== */}

          <div
            className="col-6 col-md-3"
          >

            <button
              type="button"
              className="quick-card w-100 border-0"
              data-testid="quick-transactions"
              onClick={() =>
                navigate("/transactions")
              }
            >

              <span
                className="fs-3"
                aria-hidden="true"
              >
                📜
              </span>


              <div
                className="mt-2"
              >
                Transactions
              </div>

            </button>

          </div>


          {/* ==================================================
              STATEMENT
              ================================================== */}

          <div
            className="col-6 col-md-3"
          >

            <button
              type="button"
              className="quick-card w-100 border-0"
              data-testid="quick-statement"
              onClick={() =>
                navigate("/statements")
              }
            >

              <span
                className="fs-3"
                aria-hidden="true"
              >
                📄
              </span>


              <div
                className="mt-2"
              >
                Statement
              </div>

            </button>

          </div>

        </div>

      </section>


      {/* ======================================================
          RECENT TRANSACTIONS
          ====================================================== */}

      <section
        className="transaction-card mt-5"
        data-testid="recent-transactions"
      >

        <div
          className="
            d-flex
            justify-content-between
            align-items-center
          "
        >

          <h2
            className="h5 mb-0"
          >
            Recent Transactions
          </h2>


          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            data-testid="view-all-transactions"
            onClick={() =>
              navigate("/transactions")
            }
          >

            View All

          </button>

        </div>


        <div
          className="table-responsive mt-3"
        >

          <table
            className="table align-middle mb-0"
          >

            <thead>

              <tr>

                <th scope="col">
                  ID
                </th>

                <th scope="col">
                  Type
                </th>

                <th scope="col">
                  Amount
                </th>

                <th scope="col">
                  Status
                </th>

                <th scope="col">
                  Date
                </th>

              </tr>

            </thead>


            <tbody>

              {transactions.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      text-center
                      text-muted
                      py-4
                    "
                  >

                    No recent transactions

                  </td>

                </tr>

              ) : (

                transactions
                  .slice(0, 5)
                  .map(
                    (
                      transaction
                    ) => (

                      <tr
                        key={
                          transaction.id
                        }
                        data-testid={
                          `transaction-row-${transaction.id}`
                        }
                      >

                        <td>

                          <strong>
                            #{transaction.id}
                          </strong>

                        </td>


                        <td>

                          {transaction.transaction_type ||
                            "Transfer"}

                        </td>


                        <td>

                          {formatCurrency(
                            Number(
                              transaction.amount
                            )
                          )}

                        </td>


                        <td>

                          <span
                            className={
                              transaction.status === "SUCCESS" ||
                              transaction.status === "COMPLETED"
                                ? "badge bg-success"
                                : "badge bg-secondary"
                            }
                          >

                            {transaction.status}

                          </span>

                        </td>


                        <td>

                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}

                        </td>

                      </tr>

                    )
                  )

              )}

            </tbody>

          </table>

        </div>

      </section>


    </div>

  );

}


export default Dashboard;