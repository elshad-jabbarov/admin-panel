// src/components/ProtectedRoute.js

import React from "react";
import PropTypes from "prop-types"; // Import PropTypes
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // User is not authenticated, redirect to login

    return <Navigate to="/authentication/sign-in" replace />;
  }
  // User is authenticated, render the children components
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
