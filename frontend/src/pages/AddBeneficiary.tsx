import {  useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { addBeneficiary } from "../services/beneficiaryService";



import "./AddBeneficiary.css";


/*
 * ============================================================
 * NH DIGITAL BANK
 * ============================================================
 *
 * Add Beneficiary
 *
 * Flow:
 *
 * Enter Details
 *      ↓
 * Validate Details
 *      ↓
 * Submit API
 *      ↓
 * Backend Validation
 *      ↓
 * Beneficiary Created
 *
 * ============================================================
 */


interface FormData {
  beneficiaryName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  bankName: string;
  ifscCode: string;
}


interface FormErrors {
  beneficiaryName?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  general?: string;
}


function AddBeneficiary() {

  const navigate =
    useNavigate();


  /*
   * ==========================================================
   * FORM STATE
   * ==========================================================
   */

  const [
    formData,
    setFormData
  ] = useState<FormData>({
    beneficiaryName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    bankName: "",
    ifscCode: ""
  });


  /*
   * ==========================================================
   * VALIDATION STATE
   * ==========================================================
   */

  const [
    errors,
    setErrors
  ] = useState<FormErrors>({});


  /*
   * ==========================================================
   * SUBMIT STATE
   * ==========================================================
   */

  const [
    submitting,
    setSubmitting
  ] = useState(false);


  /*
   * ==========================================================
   * SUCCESS STATE
   * ==========================================================
   */

  const [
    success,
    setSuccess
  ] = useState(false);


  /*
   * ==========================================================
   * HANDLE INPUT
   * ==========================================================
   */

  function handleChange(
    field: keyof FormData,
    value: string
  ) {

    setFormData(
      previous => ({
        ...previous,
        [field]: value
      })
    );


    /*
     * Remove field-level error
     * while customer corrects the value.
     */

    setErrors(
      previous => ({
        ...previous,
        [field]: undefined,
        general: undefined
      })
    );
  }


  /*
   * ==========================================================
   * VALIDATE FORM
   * ==========================================================
   */

  function validateForm(): boolean {

    const newErrors:
      FormErrors = {};


    /*
     * --------------------------------------------------------
     * Beneficiary Name
     * --------------------------------------------------------
     */

    const name =
      formData.beneficiaryName.trim();


    if (!name) {

      newErrors.beneficiaryName =
        "Beneficiary name is required.";

    } else if (name.length < 2) {

      newErrors.beneficiaryName =
        "Beneficiary name must contain at least 2 characters.";

    } else if (name.length > 100) {

      newErrors.beneficiaryName =
        "Beneficiary name cannot exceed 100 characters.";

    }


    /*
     * --------------------------------------------------------
     * Account Number
     * --------------------------------------------------------
     */

    const accountNumber =
      formData.accountNumber.trim();


    if (!accountNumber) {

      newErrors.accountNumber =
        "Account number is required.";

    } else if (
      !/^\d{9,18}$/.test(
        accountNumber
      )
    ) {

      newErrors.accountNumber =
        "Enter a valid account number.";

    }


    /*
     * --------------------------------------------------------
     * Confirm Account Number
     * --------------------------------------------------------
     */

    const confirmAccountNumber =
      formData.confirmAccountNumber.trim();


    if (!confirmAccountNumber) {

      newErrors.confirmAccountNumber =
        "Please confirm the account number.";

    } else if (
      confirmAccountNumber !==
      accountNumber
    ) {

      newErrors.confirmAccountNumber =
        "Account numbers do not match.";

    }


    /*
     * --------------------------------------------------------
     * Bank Name
     * --------------------------------------------------------
     */

    const bankName =
      formData.bankName.trim();


    if (!bankName) {

      newErrors.bankName =
        "Bank name is required.";

    } else if (bankName.length < 2) {

      newErrors.bankName =
        "Enter a valid bank name.";

    }


    /*
     * --------------------------------------------------------
     * IFSC
     * --------------------------------------------------------
     *
     * Standard Indian IFSC format:
     *
     * 4 letters
     * 0
     * 6 alphanumeric characters
     *
     * Example:
     * SBIN0001234
     * --------------------------------------------------------
     */

    const ifscCode =
      formData.ifscCode
        .trim()
        .toUpperCase();


    if (!ifscCode) {

      newErrors.ifscCode =
        "IFSC code is required.";

    } else if (
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        ifscCode
      )
    ) {

      newErrors.ifscCode =
        "Enter a valid IFSC code.";

    }


    setErrors(
      newErrors
    );


    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  }


  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    /*
     * Prevent duplicate submissions.
     */

    if (submitting) {

      return;

    }


    setSuccess(false);


    /*
     * Client-side validation.
     */

    if (!validateForm()) {

      return;

    }


    try {

      setSubmitting(true);


      /*
       * Send only fields required by backend.
       */

      await addBeneficiary({

        beneficiaryName:
          formData.beneficiaryName.trim(),

        accountNumber:
          formData.accountNumber.trim(),

        bankName:
          formData.bankName.trim(),

        ifscCode:
          formData.ifscCode
            .trim()
            .toUpperCase()

      });


      /*
       * Successful creation.
       */

      setSuccess(true);


      /*
       * Give the customer a short success
       * confirmation before returning to
       * the beneficiary list.
       */

      setTimeout(() => {

        navigate(
          "/beneficiaries"
        );

      }, 1200);


    } catch (
      error: any
    ) {

      console.error(
        "Add beneficiary error:",
        error
      );


      /*
       * Backend error message.
       */

      const message =
        error?.response?.data?.message ||
        "Unable to add beneficiary. Please try again.";


      setErrors({
        general: message
      });


    } finally {

      setSubmitting(false);

    }

  }


  /*
   * ==========================================================
   * CANCEL
   * ==========================================================
   */

  function handleCancel() {

    if (submitting) {

      return;

    }


    navigate(
      "/beneficiaries"
    );

  }


  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (

    <div
      className="nh-beneficiary-page"
      data-testid="add-beneficiary-page"
    >


      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div
        className="nh-page-header"
      >

        <div>

          <button
            type="button"
            className="nh-back-button"
            onClick={handleCancel}
            data-testid="back-to-beneficiaries"
          >

            ← Back to Beneficiaries

          </button>


          <h1
            className="nh-page-title"
          >

            Add Beneficiary

          </h1>


          <p
            className="nh-page-description"
          >

            Add a trusted beneficiary for future fund transfers.

          </p>

        </div>

      </div>


      {/* ======================================================
          SUCCESS MESSAGE
          ====================================================== */}

      {success && (

        <div
          className="nh-success-alert"
          role="status"
          data-testid="beneficiary-success"
        >

          <span
            className="nh-success-icon"
          >
            ✓
          </span>

          <div>

            <strong>
              Beneficiary added successfully
            </strong>

            <p>
              Redirecting to your beneficiaries...
            </p>

          </div>

        </div>

      )}


      {/* ======================================================
          GENERAL ERROR
          ====================================================== */}

      {errors.general && (

        <div
          className="nh-error-alert"
          role="alert"
          data-testid="beneficiary-error"
        >

          <span>
            !
          </span>

          <div>

            <strong>
              Unable to add beneficiary
            </strong>

            <p>
              {errors.general}
            </p>

          </div>

        </div>

      )}


      {/* ======================================================
          FORM CARD
          ====================================================== */}

      <div
        className="nh-form-card"
      >


        {/* ====================================================
            FORM HEADER
            ==================================================== */}

        <div
          className="nh-form-card-header"
        >

          <div
            className="nh-form-icon"
          >
            👤
          </div>


          <div>

            <h2>
              Beneficiary Details
            </h2>

            <p>
              Enter the beneficiary's bank account information.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          noValidate
          data-testid="add-beneficiary-form"
        >


          {/* ==================================================
              BENEFICIARY NAME
              ================================================== */}

          <div
            className="nh-form-group"
          >

            <label
              htmlFor="beneficiary-name"
            >

              Beneficiary Name
              <span className="required">
                *
              </span>

            </label>


            <input
              id="beneficiary-name"
              name="beneficiaryName"
              type="text"
              value={
                formData.beneficiaryName
              }
              onChange={(event) =>
                handleChange(
                  "beneficiaryName",
                  event.target.value
                )
              }
              placeholder="Enter beneficiary name"
              autoComplete="off"
              maxLength={100}
              disabled={submitting}
              aria-invalid={
                Boolean(
                  errors.beneficiaryName
                )
              }
              aria-describedby={
                errors.beneficiaryName
                  ? "beneficiary-name-error"
                  : undefined
              }
              data-testid="beneficiary-name"
            />


            {errors.beneficiaryName && (

              <div
                id="beneficiary-name-error"
                className="nh-field-error"
              >

                {errors.beneficiaryName}

              </div>

            )}

          </div>


          {/* ==================================================
              ACCOUNT NUMBERS
              ================================================== */}

          <div
            className="nh-form-grid"
          >


            {/* Account Number */}

            <div
              className="nh-form-group"
            >

              <label
                htmlFor="account-number"
              >

                Account Number
                <span className="required">
                  *
                </span>

              </label>


              <input
                id="account-number"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                value={
                  formData.accountNumber
                }
                onChange={(event) =>
                  handleChange(
                    "accountNumber",
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter account number"
                maxLength={18}
                autoComplete="off"
                disabled={submitting}
                aria-invalid={
                  Boolean(
                    errors.accountNumber
                  )
                }
                data-testid="account-number"
              />


              {errors.accountNumber && (

                <div
                  className="nh-field-error"
                >

                  {errors.accountNumber}

                </div>

              )}

            </div>


            {/* Confirm Account Number */}

            <div
              className="nh-form-group"
            >

              <label
                htmlFor="confirm-account-number"
              >

                Confirm Account Number
                <span className="required">
                  *
                </span>

              </label>


              <input
                id="confirm-account-number"
                name="confirmAccountNumber"
                type="text"
                inputMode="numeric"
                value={
                  formData.confirmAccountNumber
                }
                onChange={(event) =>
                  handleChange(
                    "confirmAccountNumber",
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Re-enter account number"
                maxLength={18}
                autoComplete="off"
                disabled={submitting}
                aria-invalid={
                  Boolean(
                    errors.confirmAccountNumber
                  )
                }
                data-testid="confirm-account-number"
              />


              {errors.confirmAccountNumber && (

                <div
                  className="nh-field-error"
                >

                  {errors.confirmAccountNumber}

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              BANK DETAILS
              ================================================== */}

          <div
            className="nh-form-grid"
          >


            {/* Bank Name */}

            <div
              className="nh-form-group"
            >

              <label
                htmlFor="bank-name"
              >

                Bank Name
                <span className="required">
                  *
                </span>

              </label>


              <input
                id="bank-name"
                name="bankName"
                type="text"
                value={
                  formData.bankName
                }
                onChange={(event) =>
                  handleChange(
                    "bankName",
                    event.target.value
                  )
                }
                placeholder="Enter bank name"
                maxLength={100}
                autoComplete="off"
                disabled={submitting}
                aria-invalid={
                  Boolean(
                    errors.bankName
                  )
                }
                data-testid="bank-name"
              />


              {errors.bankName && (

                <div
                  className="nh-field-error"
                >

                  {errors.bankName}

                </div>

              )}

            </div>


            {/* IFSC */}

            <div
              className="nh-form-group"
            >

              <label
                htmlFor="ifsc-code"
              >

                IFSC Code
                <span className="required">
                  *
                </span>

              </label>


              <input
                id="ifsc-code"
                name="ifscCode"
                type="text"
                value={
                  formData.ifscCode
                }
                onChange={(event) =>
                  handleChange(
                    "ifscCode",
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]/g,
                        ""
                      )
                  )
                }
                placeholder="Example: SBIN0001234"
                maxLength={11}
                autoComplete="off"
                disabled={submitting}
                aria-invalid={
                  Boolean(
                    errors.ifscCode
                  )
                }
                data-testid="ifsc-code"
              />


              <small
                className="nh-field-help"
              >

                11-character bank branch code.

              </small>


              {errors.ifscCode && (

                <div
                  className="nh-field-error"
                >

                  {errors.ifscCode}

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              SECURITY NOTICE
              ================================================== */}

          <div
            className="nh-security-notice"
            data-testid="beneficiary-security-notice"
          >

            <div
              className="nh-security-icon"
            >
              🔒
            </div>


            <div>

              <strong>
                Security Notice
              </strong>


              <p>

                Verify the beneficiary account details carefully
                before adding them. Never share your banking
                credentials, transaction PIN, or OTP with anyone.

              </p>

            </div>

          </div>


          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div
            className="nh-form-actions"
          >

            <button
              type="button"
              className="nh-button nh-button-secondary"
              onClick={handleCancel}
              disabled={submitting}
              data-testid="cancel-beneficiary"
            >

              Cancel

            </button>


            <button
              type="submit"
              className="nh-button nh-button-primary"
              disabled={submitting}
              data-testid="submit-beneficiary"
            >

              {submitting ? (

                <>

                  <span
                    className="nh-button-spinner"
                    aria-hidden="true"
                  />

                  Adding Beneficiary...

                </>

              ) : (

                <>
                  Add Beneficiary
                </>

              )}

            </button>

          </div>

        </form>

      </div>


      {/* ======================================================
          FOOTER SECURITY INFORMATION
          ====================================================== */}

      <div
        className="nh-page-security"
      >

        🔐 Your information is transmitted securely.

      </div>

    </div>

  );
}


export default AddBeneficiary;