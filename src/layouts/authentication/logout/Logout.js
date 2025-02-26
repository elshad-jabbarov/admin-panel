// src/layouts/authentication/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the token from local storage (or any other storage you use)
    localStorage.removeItem("token");
    // Optionally, clear other stored user details or state here

    // Redirect the user to the sign-in page
    navigate("/authentication/sign-in", { replace: true });
  }, [navigate]);

  // Optionally, you can display a message or a spinner while logging out.
  return null;
};

export default Logout;
