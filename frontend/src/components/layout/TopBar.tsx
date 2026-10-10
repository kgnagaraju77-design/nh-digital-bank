import { useNavigate } from "react-router-dom";

export default function TopBar() {

  const navigate =
    useNavigate();


  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  function handleLogout() {

    localStorage.removeItem(
      "nh_token"
    );

    navigate(
      "/login",
      {
        replace: true
      }
    );
  }


  /*
   * ============================================================
   * USER DISPLAY
   * ============================================================
   *
   * We will later replace this with
   * authenticated user information
   * from the backend.
   * ============================================================
   */

  const userName =
    localStorage.getItem(
      "nh_user_name"
    ) || "Customer";


  const initial =
    userName
      .charAt(0)
      .toUpperCase();


  return (

    <header
      className="nh-topbar"
      data-testid="topbar"
    >

      {/* ======================================================
          BRAND
          ====================================================== */}

      <div
        className="nh-brand"
        data-testid="nh-brand"
      >

        <div
          className="nh-logo"
          aria-label="NH Digital Bank"
        >
          NH
        </div>


        <div>

          <p
            className="nh-brand-name"
          >
            NH Digital Bank
          </p>

          <p
            className="nh-brand-tagline"
          >
            Secure. Simple. Smart.
          </p>

        </div>

      </div>


      {/* ======================================================
          USER AREA
          ====================================================== */}

      <div
        className="nh-user"
        data-testid="user-menu"
      >

        <button
          type="button"
          aria-label="Notifications"
          data-testid="notifications-button"
          onClick={() =>
            navigate("/notifications")
          }
          style={{
            border: "0",
            background: "transparent",
            fontSize: "20px",
            padding: "8px"
          }}
        >
          ♢
        </button>


        <button
          type="button"
          data-testid="profile-button"
          onClick={() =>
            navigate("/profile")
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "0",
            background: "transparent",
            padding: "4px"
          }}
        >

          <span
            className="nh-avatar"
            aria-hidden="true"
          >
            {initial}
          </span>


          <span
            style={{
              fontWeight: 650,
              color: "#172033"
            }}
          >
            {userName}
          </span>

        </button>


        <button
          type="button"
          className="nh-btn nh-btn-secondary"
          data-testid="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </header>
  );
}