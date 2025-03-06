/**
 =========================================================
 * Material Dashboard 2 React - v2.2.0
 =========================================================

 * Product Page: https://www.creative-tim.com/product/material-dashboard-react
 * Copyright 2023 Creative Tim (https://www.creative-tim.com)

 Coded by www.creative-tim.com

 =========================================================

 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";
import axios from "axios";

const container = document.getElementById("app");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>
);

const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
});

axiosInstance.interceptors.response.use(
  (response) => response, // On success, simply return the response.
  (error) => {
    // If unauthorized, redirect to the sign-in page.
    if (error.response && error.response.status === 403) {
      window.location.href = "/authentication/sign-in";
    }
    // Optionally, log the error or perform other actions here.
    console.error("API error intercepted:", error);
    return Promise.reject(error); // Propagate the error to be handled later.
  }
);

export default axiosInstance;

// errorUtils.js
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || "An unexpected error occurred.";
};
