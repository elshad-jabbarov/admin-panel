import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios, { extractErrorMessage } from "index";

// Material UI components
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

function PortalLogs() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedBonusId, setSelectedBonusId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    fetchLogs();
    fetchBonuses();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/portal/bonuses/${id}`, {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setLogs(response.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setGlobalError(extractErrorMessage(err));
    }
  };

  const fetchBonuses = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/bonuses", {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setBonuses(response.data);
    } catch (err) {
      console.error("Error fetching bonuses:", err);
      setGlobalError(extractErrorMessage(err));
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setErrorMessage("");
    setPlayerId("");
    setAmount("");
    setSelectedBonusId("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleAwardBonus = async () => {
    if (!playerId || !amount || !selectedBonusId) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8080/api/bonuses/award",
        {
          playerId: parseInt(playerId, 10),
          amount: parseFloat(amount),
          bonusId: parseInt(selectedBonusId, 10),
          portalId: parseInt(id, 10),
        },
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Bonus awarded successfully:", response.data);
      setIsDialogOpen(false);
      fetchLogs();
    } catch (err) {
      console.error("Error awarding bonus:", err);
      setErrorMessage(err.response?.data?.message || "An error occurred while awarding the bonus.");
    }
  };

  const columns = [
    { Header: "Status", accessor: "status" },
    { Header: "Reason", accessor: "reason" },
    { Header: "Player ID", accessor: "playerId" },
    { Header: "Amount", accessor: "calculatedAmount" },
    { Header: "Applied At", accessor: "appliedAt" },
    { Header: "Document ID", accessor: "documentId" },
    { Header: "Bonus ID", accessor: "bonusBonusId" },
    { Header: "Bonus Name", accessor: "bonusName" },
  ];

  const rows = logs.map((log) => ({
    status: log.status,
    reason: log.reason,
    playerId: log.playerId,
    calculatedAmount: log.calculatedAmount,
    appliedAt: log.appliedAt,
    documentId: log.documentId,
    bonusBonusId: log.bonusBonusId,
    bonusName: log.bonusName,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDTypography variant="h4" gutterBottom>
              Request Logs for Portal {id}
            </MDTypography>
            <MDBox display="flex" justifyContent="flex-end" mb={2}>
              <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                Award Bonus
              </Button>
            </MDBox>
            <Card>
              <DataTable
                table={{ columns, rows }}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                canSearch
                showTotalEntries
                isSorted
                pagination
              />
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Award Bonus Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Award Bonus to Player</DialogTitle>
        <DialogContent>
          {errorMessage && (
            <MDTypography color="error" variant="caption" display="block" gutterBottom>
              {errorMessage}
            </MDTypography>
          )}
          <TextField
            label="Player ID"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          />
          <TextField
            label="Amount"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="bonus-select-label">Select Bonus</InputLabel>
            <Select
              labelId="bonus-select-label"
              value={selectedBonusId}
              onChange={(e) => setSelectedBonusId(e.target.value)}
              label="Select Bonus"
            >
              {bonuses.map((bonus) => (
                <MenuItem key={bonus.bonusId} value={bonus.bonusId}>
                  {bonus.name} (ID: {bonus.bonusId})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAwardBonus} color="primary" variant="contained">
            Award Bonus
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!globalError}
        autoHideDuration={6000}
        onClose={() => setGlobalError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setGlobalError("")} severity="error" variant="filled">
          {globalError}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default PortalLogs;
