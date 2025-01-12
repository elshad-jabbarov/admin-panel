import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// Material UI components
import {
  Card,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";

// Custom components
import DataTable from "../../examples/Tables/DataTable";
import MDBox from "../../components/MDBox";
import MDTypography from "../../components/MDTypography";
import DashboardLayout from "../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../examples/Navbars/DashboardNavbar";
import Footer from "../../examples/Footer";

function PortalLogs() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [bonuses, setBonuses] = useState([]); // State to store fetched bonuses
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedBonusId, setSelectedBonusId] = useState(""); // Renamed for clarity
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchLogs();
    fetchBonuses(); // Fetch bonuses when the component mounts
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/portal/bonuses/${id}`, {
        headers: { Authorization: `${sessionStorage.getItem("token")}` },
      });
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchBonuses = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/bonuses", {
        headers: { Authorization: `${sessionStorage.getItem("token")}` },
      });
      setBonuses(response.data);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setErrorMessage("");
    // Clear previous input values
    setPlayerId("");
    setAmount("");
    setSelectedBonusId("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleAwardBonus = async () => {
    // Validate inputs
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
            Authorization: `${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Bonus awarded successfully:", response.data);
      setIsDialogOpen(false);
      // Optionally refresh logs to show the new bonus application
      fetchLogs();
    } catch (error) {
      console.error("Error awarding bonus:", error);
      setErrorMessage(
        error.response?.data?.message || "An error occurred while awarding the bonus."
      );
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
    </DashboardLayout>
  );
}

export default PortalLogs;
