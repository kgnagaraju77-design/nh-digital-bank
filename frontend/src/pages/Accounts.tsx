import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAccounts,
  getAccountStatement,
} from "../services/accountService";

import type {
  Account,
  StatementTransaction,
} from "../services/accountService";

import "./Accounts.css";

function Accounts() {

  const navigate = useNavigate();

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [selectedAccount, setSelectedAccount] =
    useState<Account | null>(null);

  const [statement, setStatement] =
    useState<StatementTransaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [statementLoading, setStatementLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [statementError, setStatementError] =
    useState("");


  useEffect(() => {

    const loadAccounts = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await getAccounts();

        console.log(
          "Accounts response:",
          response
        );

        const data =
          response?.data ?? response;

        const accountList =
          Array.isArray(data)
            ? data
            : data?.accounts ?? [];

        setAccounts(accountList);

      } catch (error: any) {

        console.error(
          "Accounts error:",
          error
        );

        if (
          error.response?.status === 401
        ) {

          localStorage.removeItem(
            "nh_token"
          );

          localStorage.removeItem(
            "nh_user"
          );

          navigate("/login");

          return;
        }

        setError(
          error.response?.data?.message ||
          "Unable to load accounts"
        );

      } finally {

        setLoading(false);

      }
    };

    loadAccounts();

  }, [navigate]);


  const handleStatement =
    async (account: Account) => {

      try {

        setSelectedAccount(account);

        setStatementLoading(true);

        setStatementError("");

        const response =
          await getAccountStatement(
            account.id
          );

        console.log(
          "Statement response:",
          response
        );

        const data =
          response?.data ?? response;

        const transactions =
          Array.isArray(data)
            ? data
            : data?.transactions ??
              data?.statement ??
              [];

        setStatement(transactions);

      } catch (error: any) {

        console.error(
          "Statement error:",
          error
        );

        setStatementError(
          error.response?.data?.message ||
          "Unable to load account statement"
        );

        setStatement([]);

      } finally {

        setStatementLoading(false);

      }
    };


  const maskAccountNumber =
    (accountNumber: string) => {

      if (!accountNumber) {
        return "****";
      }

      const lastFour =
        accountNumber.slice(-4);

      return `•••• •••• ${lastFour}`;
    };


  const formatAmount =
    (amount: number) => {

      return Number(amount || 0)
        .toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

    };


  const formatDate =
    (date: string) => {

      if (!date) {
        return "-";
      }

      return new Date(date)
        .toLocaleString("en-IN");

    };


  if (loading) {

    return (

      <div className="accounts-loading">

        <div
          className="spinner-border text-primary"
          role="status"
        />

        <p>
          Loading your accounts...
        </p>

      </div>

    );

  }


  return (

    <div className="accounts-page">

      {/* Header */}

      <header className="accounts-header">

        <div className="accounts-header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate("/dashboard")
            }
            data-testid="accounts-back"
          >
            ←
          </button>

          <div>

            <h1>
              Accounts
            </h1>

            <p>
              View your accounts and balances
            </p>

          </div>

        </div>

      </header>


      <main className="accounts-content">

        {error && (

          <div
            className="alert alert-danger"
            data-testid="accounts-error"
          >
            {error}
          </div>

        )}


        {/* Account Cards */}

        <section>

          <div className="section-title">

            <h2>
              Your Accounts
            </h2>

            <span>
              {accounts.length} account(s)
            </span>

          </div>


          {accounts.length === 0 ? (

            <div
              className="empty-state"
              data-testid="accounts-empty"
            >
              <h4>
                No accounts found
              </h4>

              <p>
                No active accounts are associated
                with your profile.
              </p>
            </div>

          ) : (

            <div className="accounts-grid">

              {accounts.map((account) => (

                <div
                  key={account.id}
                  className="account-detail-card"
                  data-testid="account-card"
                >

                  <div className="account-card-top">

                    <div>

                      <span className="account-label">
                        {account.account_type}
                      </span>

                      <h3>
                        {maskAccountNumber(
                          account.account_number
                        )}
                      </h3>

                    </div>

                    <span
                      className={
                        account.status === "ACTIVE"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {account.status}
                    </span>

                  </div>


                  <div className="account-balance">

                    <span>
                      Available Balance
                    </span>

                    <strong>
                      ₹
                      {formatAmount(
                        account.balance
                      )}
                    </strong>

                  </div>


                  <div className="account-card-actions">

                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleStatement(account)
                      }
                      data-testid="view-statement-button"
                    >
                      View Statement
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* Statement */}

        {selectedAccount && (

          <section
            className="statement-section"
            data-testid="statement-section"
          >

            <div className="statement-header">

              <div>

                <h2>
                  Account Statement
                </h2>

                <p>
                  {selectedAccount.account_type}
                  {" "}
                  {maskAccountNumber(
                    selectedAccount.account_number
                  )}
                </p>

              </div>

              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedAccount(null);
                  setStatement([]);
                }}
                data-testid="close-statement"
              >
                Close
              </button>

            </div>


            {statementLoading && (

              <div className="statement-loading">

                <div
                  className="spinner-border text-primary"
                />

                <p>
                  Loading statement...
                </p>

              </div>

            )}


            {statementError && (

              <div
                className="alert alert-danger"
                data-testid="statement-error"
              >
                {statementError}
              </div>

            )}


            {!statementLoading &&
              !statementError && (

              <div className="table-responsive">

                <table className="table statement-table">

                  <thead>

                    <tr>

                      <th>
                        Date
                      </th>

                      <th>
                        Reference
                      </th>

                      <th>
                        Type
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

                    {statement.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="text-center py-4"
                        >
                          No transactions found.
                        </td>

                      </tr>

                    ) : (

                      statement.map(
                        (transaction) => {

                          const type =
                            transaction.transaction_type ||
                            transaction.transfer_type ||
                            "TRANSFER";

                          return (

                            <tr
                              key={
                                transaction.id
                              }
                              data-testid="statement-row"
                            >

                              <td>
                                {formatDate(
                                  transaction.created_at
                                )}
                              </td>

                              <td>
                                {transaction.transaction_reference ||
                                  `TXN-${transaction.id}`}
                              </td>

                              <td>
                                <span
                                  className={
                                    type
                                      .toUpperCase()
                                      .includes("DEBIT")
                                      ? "debit-text"
                                      : "credit-text"
                                  }
                                >
                                  {type}
                                </span>
                              </td>

                              <td>
                                ₹
                                {formatAmount(
                                  transaction.amount
                                )}
                              </td>

                              <td>

                                <span className="badge bg-secondary">
                                  {transaction.status}
                                </span>

                              </td>

                            </tr>

                          );

                        }
                      )

                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}

      </main>

    </div>

  );
}

export default Accounts;