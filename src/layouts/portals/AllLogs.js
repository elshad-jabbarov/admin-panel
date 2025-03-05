import React, { useEffect, useState } from "react";
import axios, { extractErrorMessage } from "index";

// Material UI components
import { Card, Grid, Snackbar, Alert } from "@mui/material";

// Custom components
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function AllLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const fetchAllLogs = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/portal/logs", {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setLogs(response.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { Header: "Portal Adı", accessor: "portalName", align: "left" },
    { Header: "Durum", accessor: "status", align: "left" },
    { Header: "Sebep", accessor: "reason", align: "left" },
    { Header: "Oyuncu ID", accessor: "playerId", align: "center" },
    { Header: "Miktar", accessor: "calculatedAmount", align: "center" },
    { Header: "Uygulama Tarihi", accessor: "appliedAt", align: "center" },
    { Header: "Belge ID", accessor: "documentId", align: "center" },
    { Header: "Bonus Adı", accessor: "bonusName", align: "left" },
  ];

  const rows = logs.map((log) => ({
    portalName: log.portalName,
    status: log.status,
    reason: log.reason,
    playerId: log.playerId,
    calculatedAmount: log.calculatedAmount,
    appliedAt: new Date(log.appliedAt).toLocaleString(),
    documentId: log.documentId,
    bonusName: log.bonusName,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDTypography variant="h4" gutterBottom>
              Tüm Portal Günlükleri
            </MDTypography>
            <Card>
              {loading ? (
                <MDBox display="flex" justifyContent="center" alignItems="center" p={3}>
                  <MDTypography variant="h6">Yükleniyor...</MDTypography>
                </MDBox>
              ) : (
                <DataTable
                  table={{ columns, rows }}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                  canSearch
                  showTotalEntries
                  isSorted
                  pagination
                />
              )}
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError("")} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default AllLogs;
