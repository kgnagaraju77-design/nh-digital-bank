import { useEffect, useMemo, useState } from "react";

import {
  getBeneficiaries
} from "../services/beneficiaryService";

import type {
  Beneficiary
} from "../services/beneficiaryService";

import { useNavigate } from "react-router-dom";


/*
 * ============================================================
 * BENEFICIARIES PAGE
 *
 * NH Digital Bank
 * Secure. Simple. Smart.
 *
 * Features:
 * - Load beneficiaries from backend
 * - Search
 * - Mask account numbers
 * - Active / Deleted status
 * - Loading state
 * - Error state
 * - Empty state
 * - Refresh
 * - Selenium-friendly test IDs
 * ============================================================
 */

export default function Beneficiaries() {

const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);


  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  const [search, setSearch] =
    useState<string>("");


  /*
   * ============================================================
   * LOAD BENEFICIARIES
   * ============================================================
   */

  async function loadBeneficiaries() {

  try {

    setLoading(true);

    setError("");

    const response =
      await getBeneficiaries();

    console.log(
      "Beneficiaries API response:",
      response
    );


    if (!response?.success) {

      throw new Error(
        "Unable to load beneficiaries"
      );

    }


    const beneficiaryList =
      response?.data?.beneficiaries;


    if (!Array.isArray(beneficiaryList)) {

      throw new Error(
        "Invalid beneficiaries response from server"
      );

    }


    setBeneficiaries(
      beneficiaryList
    );

  } catch (error: any) {

    console.error(
      "Beneficiary loading error:",
      error
    );

    setBeneficiaries([]);

    setError(
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load beneficiaries"
    );

  } finally {

    setLoading(false);

  }

}

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {

    loadBeneficiaries();

  }, []);


  /*
   * ============================================================
   * SEARCH BENEFICIARIES
   * ============================================================
   */

 const filteredBeneficiaries =
  useMemo(() => {

    const searchValue =
      search
        .trim()
        .toLowerCase();

    if (!searchValue) {

      return beneficiaries;

    }

    return beneficiaries.filter(
      (beneficiary) => {

        return (

          beneficiary.beneficiary_name
            ?.toLowerCase()
            .includes(searchValue)

          ||

          beneficiary.bank_name
            ?.toLowerCase()
            .includes(searchValue)

          ||

          beneficiary.account_number
            ?.includes(searchValue)

          ||

          beneficiary.ifsc_code
            ?.toLowerCase()
            .includes(searchValue)

        );

      }
    );

  }, [
    beneficiaries,
    search
  ]);
  /*
   * ============================================================
   * MASK ACCOUNT NUMBER
   * ============================================================
   */

  function maskAccountNumber(
    accountNumber: string
  ): string {

    if (accountNumber.length <= 4) {

      return accountNumber;

    }

    return (
      "•••• •••• " +
      accountNumber.slice(-4)
    );
  }


  /*
   * ============================================================
   * ADD BENEFICIARY
   * ============================================================
   */

  function handleAddBeneficiary() {

    /*
     * We will connect the real
     * Add Beneficiary workflow next.
     */

      navigate("/beneficiaries/add");
  }


  /*
   * ============================================================
   * TRANSFER
   * ============================================================
   */
function handleTransfer(
  beneficiary: Beneficiary
) {

  navigate(
    "/transfers",
    {
      state: {
        beneficiaryId:
          beneficiary.id
      }
    }
  );

}


  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {

    return (

      <main
        data-testid="beneficiaries-page"
        aria-busy="true"
      >

        <section
          data-testid="beneficiaries-loading"
        >

          <p>
            Loading beneficiaries...
          </p>

        </section>

      </main>
    );
  }


  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (

 <div
  data-testid="beneficiaries-page"
>

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <header className="nh-page-header">

  <div>

    <h1 className="nh-page-title">
      Beneficiaries
    </h1>

    <p className="nh-page-description">
      Manage your saved beneficiaries
    </p>

  </div>


  <button
    type="button"
    className="nh-btn nh-btn-primary"
    data-testid="add-beneficiary-button"
    onClick={handleAddBeneficiary}
  >
    + Add Beneficiary
  </button>

</header>
      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <section
          data-testid="beneficiary-error"
          role="alert"
        >

          <p>
            {error}
          </p>

          <button
            type="button"
            data-testid="beneficiary-retry"
            onClick={
              loadBeneficiaries
            }
          >
            Retry
          </button>

        </section>

      )}


      {/* =====================================================
          SEARCH
          ===================================================== */}

      {!error && (

        <section className="nh-search-container">

  <span
    className="nh-search-icon"
    aria-hidden="true"
  >
    🔍
  </span>

  <input
    id="beneficiary-search"
    type="search"
    className="nh-search"
    data-testid="beneficiary-search"
    placeholder="Search beneficiary, bank, account or IFSC"
    value={search}
    onChange={(event) =>
      setSearch(event.target.value)
    }
  />

</section>

      )}


      {/* =====================================================
          RESULTS SUMMARY
          ===================================================== */}

      {!error && (

        <div
          data-testid="beneficiary-count"
        >

          {filteredBeneficiaries.length}{" "}
          {filteredBeneficiaries.length === 1
            ? "beneficiary"
            : "beneficiaries"}

        </div>

      )}


      {/* =====================================================
          EMPTY STATE
          ===================================================== */}

      {!error &&
        filteredBeneficiaries.length === 0 && (

          <section
            data-testid="beneficiary-empty"
          >

            {search ? (

              <>
                <h2>
                  No beneficiaries found
                </h2>

                <p>
                  Try a different search.
                </p>
              </>

            ) : (

              <>
                <h2>
                  No beneficiaries yet
                </h2>

                <p>
                  Add a beneficiary to
                  make transfers easier.
                </p>

                <button
                  type="button"
                  data-testid="empty-add-beneficiary-button"
                  onClick={
                    handleAddBeneficiary
                  }
                >
                  Add Beneficiary
                </button>
              </>

            )}

          </section>

        )}


      {/* =====================================================
          BENEFICIARY LIST
          ===================================================== */}

      {!error &&
        filteredBeneficiaries.length > 0 && (

          <section
  data-testid="beneficiary-list"
  className="nh-beneficiary-grid"
>

            {filteredBeneficiaries.map(
              (beneficiary) => (

                <article
  key={beneficiary.id}
  data-testid={`beneficiary-card-${beneficiary.id}`}
  className="nh-beneficiary-card"
>

  <div className="nh-beneficiary-header">

    <div className="nh-beneficiary-identity">

      <div className="nh-beneficiary-avatar">
        {beneficiary.beneficiary_name
          .charAt(0)
          .toUpperCase()}
      </div>

      <div>

        <h2 className="nh-beneficiary-name">
          {beneficiary.beneficiary_name}
        </h2>

        <p className="nh-beneficiary-bank">
          {beneficiary.bank_name}
        </p>

      </div>

    </div>


    <span
      className={
        beneficiary.status === "ACTIVE"
          ? "nh-status nh-status-active"
          : "nh-status nh-status-deleted"
      }
    >
      {beneficiary.status}
    </span>

  </div>


  <div className="nh-detail-row">

    <span className="nh-detail-label">
      Account Number
    </span>

    <strong className="nh-detail-value">
      {maskAccountNumber(
        beneficiary.account_number
      )}
    </strong>

  </div>


  <div className="nh-detail-row">

    <span className="nh-detail-label">
      IFSC
    </span>

    <strong className="nh-detail-value">
      {beneficiary.ifsc_code}
    </strong>

  </div>


  <div className="nh-card-actions">

    {beneficiary.status === "ACTIVE" ? (

      <button
        type="button"
        className="nh-transfer-btn"
        data-testid={`transfer-to-beneficiary-${beneficiary.id}`}
        onClick={() =>
          handleTransfer(beneficiary)
        }
      >
        Transfer →
      </button>

    ) : (

      <span className="nh-detail-label">
        Beneficiary unavailable
      </span>

    )}

  </div>

</article>

              )
            )}

          </section>

        )}

    </div>
  );
}