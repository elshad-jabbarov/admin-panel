import React, { useState } from "react";
import axios from "index";
import PropTypes from "prop-types";

// Soft UI components
import MDBox from "../../components/MDBox";
import MDButton from "../../components/MDButton";
import MDInput from "../../components/MDInput";
import MDTypography from "../../components/MDTypography";

// MUI components
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

function PortalFormModal({ onClose, onSave }) {
  // Portal form states
  const [domainName, setDomainName] = useState("");
  const [portalType, setPortalType] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [apiToken, setApiToken] = useState("");

  // Track if the user attempted to submit (for validation)
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Simple helper to check for empty strings
  const isEmpty = (value) => !value || value.trim() === "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationAttempted(true);

    // Validate required fields (domainName, portalType, apiUsername, apiPassword)
    if (
      isEmpty(domainName) ||
      isEmpty(portalType) ||
      isEmpty(apiUsername) ||
      isEmpty(apiPassword)
    ) {
      return; // Stop submission if required fields are empty
    }

    // Build payload
    const portalData = {
      domainName,
      portalType,
      apiUsername,
      apiPassword,
      // apiToken is optional
      apiToken: apiToken || "",
    };

    try {
      const response = await axios.post("http://localhost:8080/api/portal", portalData, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      // Pass the newly created portal back to the main component
      onSave(response.data);
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

          {/* Domain Name (required) */}
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Domain Name"
              fullWidth
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              error={validationAttempted && isEmpty(domainName)}
              helperText={
                validationAttempted && isEmpty(domainName) ? "Domain Name is required." : ""
              }
            />
          </MDBox>

          {/* Portal Type (required, select) */}
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="portal-type-label">Portal Type</InputLabel>
              <Select
                labelId="portal-type-label"
                label="Portal Type"
                value={portalType}
                onChange={(e) => setPortalType(e.target.value)}
                error={validationAttempted && isEmpty(portalType)}
              >
                <MenuItem value="betcostatic">betcostatic</MenuItem>
                <MenuItem value="other">other</MenuItem>
              </Select>
            </FormControl>
            {validationAttempted && isEmpty(portalType) && (
              <MDTypography variant="caption" color="error">
                Portal Type is required.
              </MDTypography>
            )}
          </MDBox>

          {/* API Username (required) */}
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="API Username"
              fullWidth
              value={apiUsername}
              onChange={(e) => setApiUsername(e.target.value)}
              error={validationAttempted && isEmpty(apiUsername)}
              helperText={
                validationAttempted && isEmpty(apiUsername) ? "API Username is required." : ""
              }
            />
          </MDBox>

          {/* API Password (required) */}
          <MDBox mb={2}>
            <MDInput
              type="password"
              label="API Password"
              fullWidth
              value={apiPassword}
              onChange={(e) => setApiPassword(e.target.value)}
              error={validationAttempted && isEmpty(apiPassword)}
              helperText={
                validationAttempted && isEmpty(apiPassword) ? "API Password is required." : ""
              }
            />
          </MDBox>

          {/* API Token (optional) */}
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="API Token (Optional)"
              fullWidth
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
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
