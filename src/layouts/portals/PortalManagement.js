import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, Grid, IconButton, Menu, MenuItem, Snackbar, Alert } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios, { extractErrorMessage } from "index";
import { useNavigate } from "react-router-dom";

// Soft UI / custom components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";

// Layout containers
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Portal form modal
import PortalFormModal from "./PortalFormModal";

const PORTAL_API = "http://localhost:8080/api/portal";

/**
 * Her portal satırı için aksiyon menüsü.
 */
function ActionMenu({ portalId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleRequestLog = () => {
    navigate(`/portals/${portalId}/logs`);
    handleClose();
  };

  return (
    <div style={{ position: "relative" }}>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleRequestLog}>Bonus talepleri</MenuItem>
      </Menu>
    </div>
  );
}

ActionMenu.propTypes = {
  portalId: PropTypes.number.isRequired,
};

/**
 * Actions sütunu için hücre render edici.
 */
function ActionsCell({ row }) {
  return <ActionMenu portalId={row.original.id} />;
}

ActionsCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

/**
 * Ana Portal Yönetimi bileşeni.
 */
function PortalManagement() {
  const [portals, setPortals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const response = await axios.get(PORTAL_API, {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setPortals(response.data);
    } catch (err) {
      console.error("Error fetching portals:", err);
      setError(extractErrorMessage(err));
    }
  };

  const handleAddPortal = (newPortal) => {
    setPortals((prev) => [...prev, newPortal]);
    setShowModal(false);
  };

  const columns = [
    { Header: "domain ismi", accessor: "domainName" },
    { Header: "Portal Türü", accessor: "portalType" },
    { Header: "API Kullanıcı ismi", accessor: "apiUsername" },
    { Header: "İşlemler", accessor: "id", Cell: ActionsCell },
  ];

  const rows = portals.map((portal) => ({
    domainName: portal.domainName,
    portalType: portal.portalType,
    apiUsername: portal.apiUsername,
    id: portal.id,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Portallar
                </MDTypography>
                <MDButton color="info" onClick={() => setShowModal(true)}>
                  Yeni Portal Ekle
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                  canSearch
                  showTotalEntries
                  isSorted
                  pagination
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {showModal && (
        <PortalFormModal onClose={() => setShowModal(false)} onSave={handleAddPortal} />
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default PortalManagement;
