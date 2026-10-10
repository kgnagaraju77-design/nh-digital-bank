import { useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

import "./Login.css";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleSubmit =
    async (event: FormEvent) => {

      event.preventDefault();

      setError("");

      setLoading(true);

      try {

        const response =
          await api.post(
            "/auth/login",
            {
              email,
              password,
            }
          );


        console.log(
          "Login response:",
          response.data
        );


        /*
         * Store JWT token
         */

        const token =
          response.data?.data?.token ||
          response.data?.token;


        if (!token) {

          throw new Error(
            "Token not received"
          );
        }


        localStorage.setItem(
          "nh_token",
          token
        );


        /*
         * Store user information
         */

        const user =
          response.data?.data?.user ||
          response.data?.user;


        if (user) {

          localStorage.setItem(
            "nh_user",
            JSON.stringify(user)
          );
        }


        /*
         * Navigate to dashboard
         */

        navigate("/dashboard");

      } catch (error: any) {

        console.error(
          "Login error:",
          error
        );


        const message =
          error.response?.data?.message ||
          "Invalid email or password";


        setError(message);

      } finally {

        setLoading(false);

      }
    };


  return (

    <div className="login-page">

      <div className="login-container">

        <div className="bank-brand">

          <div className="bank-logo">
            NH
          </div>

          <h1>
            NH Digital Bank
          </h1>

          <p>
            Secure. Simple. Smart.
          </p>

        </div>


        <div className="login-card">

          <h2>
            Welcome Back
          </h2>

          <p className="login-subtitle">
            Sign in to access your account
          </p>


          {error && (

            <div
              className="alert alert-danger"
              data-testid="login-error"
            >
              {error}
            </div>

          )}


          <form
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                data-testid="login-email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                data-testid="login-password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>


            <div className="forgot-password">

              <button
                type="button"
                className="link-button"
              >
                Forgot Password?
              </button>

            </div>


            <button
              type="submit"
              data-testid="login-button"
              className="btn login-button w-100"
              disabled={loading}
            >

              {loading
                ? "Signing in..."
                : "Login"}

            </button>

          </form>


          <div className="register-section">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              data-testid="register-link"
              className="link-button register-link"
            >
              Register
            </button>

          </div>

        </div>


        <div className="security-message">

          🔒 Your information is protected
          with bank-grade security.

        </div>

      </div>

    </div>

  );
}

export default Login;