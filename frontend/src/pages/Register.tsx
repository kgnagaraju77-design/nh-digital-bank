import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const initialForm: RegistrationForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  marginTop: "6px",
  marginBottom: "16px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  boxSizing: "border-box" as const,
  fontSize: "15px",
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<RegistrationForm>(initialForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField(
    field: keyof RegistrationForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (firstName.length < 2 || firstName.length > 50) {
      setError("First name must be 2–50 characters.");
      return;
    }

    if (lastName.length < 2 || lastName.length > 50) {
      setError("Last name must be 2–50 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 100) {
      setError("Password must be 8–100 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        phone,
        password: form.password,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const responseMessage = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;

      setError(
        responseMessage ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>
            Registration successful
          </h1>

          <p>
            Your customer registration was submitted
            successfully.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            style={buttonStyle}
          >
            Continue to Login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={{ marginTop: 0, marginBottom: 6 }}>
          Create Your Account
        </h1>

        <p style={{ color: "#64748b", marginTop: 0 }}>
          NH Digital Bank — Secure. Simple. Smart.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 12,
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            minLength={2}
            maxLength={50}
            value={form.firstName}
            onChange={(e) =>
              updateField("firstName", e.target.value)
            }
            style={inputStyle}
          />

          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            minLength={2}
            maxLength={50}
            value={form.lastName}
            onChange={(e) =>
              updateField("lastName", e.target.value)
            }
            style={inputStyle}
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            style={inputStyle}
          />

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit mobile number"
            required
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            style={inputStyle}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            required
            value={form.password}
            onChange={(e) =>
              updateField("password", e.target.value)
            }
            style={inputStyle}
          />

          <label htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={(e) =>
              updateField("confirmPassword", e.target.value)
            }
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p style={{ marginBottom: 0, marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f1f5f9",
  padding: "24px 16px",
  boxSizing: "border-box" as const,
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: 440,
  background: "#ffffff",
  padding: 28,
  borderRadius: 12,
  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  padding: 12,
  background: "#123b70",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 600,
};