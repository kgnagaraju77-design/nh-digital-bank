import { NavLink } from "react-router-dom";

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "⌂"
  },
  {
    label: "Accounts",
    path: "/accounts",
    icon: "▣"
  },
  {
    label: "Transfer Money",
    path: "/transfers",
    icon: "↗"
  },
  {
    label: "Beneficiaries",
    path: "/beneficiaries",
    icon: "♙"
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: "↔"
  },
  {
    label: "Statements",
    path: "/statements",
    icon: "▤"
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: "♢"
  }
];

const securityItems: NavigationItem[] = [
  {
    label: "Security",
    path: "/security",
    icon: "⌑"
  },
  {
    label: "Profile",
    path: "/profile",
    icon: "◯"
  }
];

export default function Sidebar() {

  return (
    <aside
      className="nh-sidebar"
      data-testid="sidebar"
    >

      <div className="nh-sidebar-title">
        Banking
      </div>


      <nav
        aria-label="Main navigation"
      >

        {navigationItems.map(
          (item) => (

            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nh-nav-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              data-testid={
                `nav-${item.label
                  .toLowerCase()
                  .replaceAll(" ", "-")}`
              }
            >

              <span
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>

          )
        )}

      </nav>


      <div
        className="nh-sidebar-title"
        style={{
          marginTop: "28px"
        }}
      >
        Account
      </div>


      <nav
        aria-label="Account navigation"
      >

        {securityItems.map(
          (item) => (

            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nh-nav-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              data-testid={
                `nav-${item.label
                  .toLowerCase()}`
              }
            >

              <span
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>

          )
        )}

      </nav>


      <div
        style={{
          marginTop: "auto",
          padding: "24px 12px 0"
        }}
      >

        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            background: "#f4f7fb",
            fontSize: "12px",
            color: "#687386"
          }}
        >

          <strong
            style={{
              display: "block",
              color: "#123c73",
              marginBottom: "5px"
            }}
          >
            NH Digital Bank
          </strong>

          Secure. Simple. Smart.

        </div>

      </div>

    </aside>
  );
}