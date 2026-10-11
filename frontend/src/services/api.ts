import axios from "axios";


/*
 * ============================================================
 * NH DIGITAL BANK API CLIENT
 * ============================================================
 */

const api = axios.create({

  baseURL:
    "https://nh-digital-bank-api.onrender.com/api",

  headers: {
    "Content-Type":
      "application/json"
  }

});


/*
 * ============================================================
 * REQUEST INTERCEPTOR
 * ============================================================
 *
 * Automatically attaches the authenticated user's JWT
 * to every API request.
 * ============================================================
 */

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        "nh_token"
      );


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    return config;

  },

  (error) => {

    return Promise.reject(
      error
    );

  }

);


/*
 * ============================================================
 * RESPONSE INTERCEPTOR
 * ============================================================
 *
 * If the backend returns 401, remove the invalid session.
 * ============================================================
 */

api.interceptors.response.use(

  (response) => {

    return response;

  },

  (error) => {

    if (
      error?.response?.status === 401
    ) {

      localStorage.removeItem(
        "nh_token"
      );

      localStorage.removeItem(
        "nh_user"
      );

    }


    return Promise.reject(
      error
    );

  }

);


export default api;