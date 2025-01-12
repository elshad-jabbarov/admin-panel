import React, { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import MDBox from "../../components/MDBox";
import MDButton from "../../components/MDButton";
import MDInput from "../../components/MDInput";
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import MDTypography from "../../components/MDTypography";

function PortalFormModal({ onClose, onSave }) {
  const [domainName, setDomainName] = useState("");
  const [portalType, setPortalType] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const portalData = { domainName, portalType, apiUsername, apiPassword, apiToken, otp };

    try {
      const response = await axios.post("http://localhost:8080/api/portal", portalData, {
        headers: {
          Authorization: ` ${sessionStorage.getItem("token")}`, // Adjust if token is in sessionStorage or other
          "Content-Type": "application/json",
        },
      });
      onSave(response.data); // Pass the newly created portal back to the main component
    } catch (error) {
      console.error("Error creating portal:", error);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <Card sx={{ maxWidth: 500, mx: "auto", my: 5, p: 4 }}>
        <MDBox component="form" role="form" onSubmit={handleSubmit}>
          <MDTypography variant="h5" mb={2}>
            Add New Portal
          </MDTypography>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Domain Name"
              fullWidth
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Portal Type"
              fullWidth
              value={portalType}
              onChange={(e) => setPortalType(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="API Username"
              fullWidth
              value={apiUsername}
              onChange={(e) => setApiUsername(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="password"
              label="API Password"
              fullWidth
              value={apiPassword}
              onChange={(e) => setApiPassword(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="API Token"
              fullWidth
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="OTP"
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </MDBox>
          <MDBox mt={3} display="flex" justifyContent="space-between">
            <MDButton color="secondary" onClick={onClose}>
              Cancel
            </MDButton>
            <MDButton type="submit" color="info">
              Save
            </MDButton>
          </MDBox>
        </MDBox>
      </Card>
    </Modal>
  );
}

PortalFormModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default PortalFormModal;
