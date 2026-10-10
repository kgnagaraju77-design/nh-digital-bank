import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";



import AppShell from "./components/layout/AppShell";



import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import Accounts from "./pages/Accounts";

import Beneficiaries from "./pages/Beneficiaries";

import AddBeneficiary
  from "./pages/AddBeneficiary";

import Transfer
  from "./pages/Transfer";

import TransferConfirmation
  from "./pages/TransferConfirmation";

  
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";

import Statements from "./pages/Statements";

/*
 * ============================================================
 * NH DIGITAL BANK
 * ============================================================
 *
 * Application:
 * NH Digital Bank
 *
 * Tagline:
 * Secure. Simple. Smart.
 *
 * ============================================================
 */


function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* ==================================================
            ROOT
            ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* ==================================================
            PUBLIC ROUTES
            ================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ==================================================
            BANKING APPLICATION
            ================================================== */}

        <Route
          path="/dashboard"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />


        <Route
          path="/accounts"
          element={
            <AppShell>
              <Accounts />
            </AppShell>
          }
        />


        {/* ==================================================
            BENEFICIARIES
            ================================================== */}

        <Route
          path="/beneficiaries"
          element={
            <AppShell>
              <Beneficiaries />
            </AppShell>
          }
        />


        <Route
          path="/beneficiaries/add"
          element={
            <AppShell>
              <AddBeneficiary />
            </AppShell>
          }
        />


        {/* ==================================================
            FUND TRANSFER
            ================================================== */}

        <Route
          path="/transfers"
          element={
            <AppShell>
              <Transfer />
            </AppShell>
          }
        />


        {/* ==================================================
            SECURE TRANSFER CONFIRMATION
            ==================================================

            Flow:

            Transfer
                ↓
            Review
                ↓
            Create Pending Transaction
                ↓
            Secure Confirmation
                ↓
            Transaction PIN
                ↓
            OTP
                ↓
            Confirm Transfer
                ↓
            Success

            ================================================== */}

        <Route
          path="/transfers/confirm"
          element={
            <AppShell>
              <TransferConfirmation />
            </AppShell>
          }
        />


        {/* ==================================================
            FUTURE ROUTES
            ==================================================

            /transactions
            /statements
            /notifications
            /security
            /profile

            ================================================== */}


        {/* ==================================================
            UNKNOWN ROUTES
            ==================================================

            Redirect unknown URLs to dashboard.

            ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

<Route
  path="/transactions"
  element={
    <AppShell>
      <Transactions />
    </AppShell>
  }
/>

<Route
  path="/transactions/:transactionId"
  element={
    <AppShell>
      <TransactionDetails />
    </AppShell>
  }
/>

<Route
  path="/statements"
  element={<Statements />}
/>
      </Routes>

    </BrowserRouter>

  );
}


export default App;