import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Grid,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DataTable from "../../examples/Tables/DataTable";
import MDBox from "../../components/MDBox";
import MDTypography from "../../components/MDTypography";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const BONUSES_API = "http://localhost:8080/api/bonuses";
const PORTALS_API = "http://localhost:8080/api/portal";

function ActionMenu({ bonus, onEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    navigate(`/bonuses/${bonus.bonusId}/details`);
    handleClose();
  };

  const handleEdit = () => {
    onEdit(bonus);
    handleClose();
  };

  const handleDelete = () => {
    onDelete(bonus.bonusId);
    handleClose();
  };

  return (
    <div>
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
        <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </div>
  );
}

ActionMenu.propTypes = {
  bonus: PropTypes.shape({
    bonusId: PropTypes.number.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    portalId: PropTypes.number,
    maxAmount: PropTypes.number,
    percentage: PropTypes.number,
    bonusType: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function BonusesManagement() {
  // State for bonuses, external bonuses, and portals
  const [bonuses, setBonuses] = useState([]);
  const [externalBonuses, setExternalBonuses] = useState([]);
  const [filteredExternalBonuses, setFilteredExternalBonuses] = useState([]);
  const [portals, setPortals] = useState([]);

  // Dialog-related state
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentBonus, setCurrentBonus] = useState(null);

  const navigate = useNavigate();

  // On component mount, fetch bonuses, external bonuses, and portals
  useEffect(() => {
    fetchBonuses();
    fetchExternalBonuses();
    fetchPortals();
  }, []);

  // Fetch existing bonuses
  const fetchBonuses = async () => {
    try {
      const response = await axios.get(BONUSES_API, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      setBonuses(response.data);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    }
  };

  // Fetch external bonuses
  const fetchExternalBonuses = async () => {
    try {
      const response = await axios.get(`${BONUSES_API}/external`, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      setExternalBonuses(response.data);
    } catch (error) {
      console.error("Error fetching external bonuses:", error);
    }
  };

  // Fetch portals
  const fetchPortals = async () => {
    try {
      const response = await axios.get(PORTALS_API, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      setPortals(response.data);
    } catch (error) {
      console.error("Error fetching portals:", error);
    }
  };

  // Handle "Add Bonus" button click
  const handleAddBonus = () => {
    setCurrentBonus({
      bonusId: null,
      name: "",
      description: "",
      portalId: "",
      maxAmount: "",
      percentage: "",
      bonusType: "",
      partnerBonusId: "", // field for parent bonus
    });
    setFilteredExternalBonuses([]); // reset filtered list
    setDialogOpen(true);
  };

  // Edit an existing bonus
  const handleEditBonus = (bonus) => {
    setCurrentBonus(bonus);

    // If bonusType is set, auto-filter external bonuses
    if (bonus.bonusType) {
      // important: use extBonus.type (lowercase) from your API
      const filtered = externalBonuses.filter(
        (extBonus) => extBonus.type === parseInt(bonus.bonusType, 10)
      );
      setFilteredExternalBonuses(filtered);
    } else {
      setFilteredExternalBonuses([]);
    }

    setDialogOpen(true);
  };

  // Delete a bonus
  const handleDeleteBonus = async (bonusId) => {
    try {
      await axios.delete(`${BONUSES_API}/${bonusId}`, {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setBonuses((prev) => prev.filter((b) => b.bonusId !== bonusId));
    } catch (error) {
      console.error("Error deleting bonus:", error);
    }
  };

  // Save bonus changes (create or update)
  const handleSaveBonus = async () => {
    const token = sessionStorage.getItem("token");
    try {
      if (currentBonus.bonusId) {
        // update existing bonus
        const response = await axios.put(`${BONUSES_API}/${currentBonus.bonusId}`, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) =>
          prev.map((b) => (b.bonusId === currentBonus.bonusId ? response.data : b))
        );
      } else {
        // create new bonus
        const response = await axios.post(BONUSES_API, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) => [...prev, response.data]);
      }
      setDialogOpen(false);
      setCurrentBonus(null);
    } catch (error) {
      console.error("Error saving bonus:", error);
    }
  };

  // Define columns for the internal bonuses table
  const bonusColumns = [
    { Header: "Bonus ID", accessor: "bonusId" },
    { Header: "Name", accessor: "name" },
    { Header: "Description", accessor: "description" },
    { Header: "Portal ID", accessor: "portalId" },
    {
      Header: "Max Amount",
      accessor: "maxAmount",
      Cell: ({ value }) => (value ? `$${value.toLocaleString()}` : "$0"),
    },
    {
      Header: "Percentage",
      accessor: "percentage",
      Cell: ({ value }) => (value ? `${value}%` : "0%"),
    },
    { Header: "Bonus Type", accessor: "bonusType" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellProps) => (
        <ActionMenu
          bonus={cellProps.row.original}
          onEdit={handleEditBonus}
          onDelete={handleDeleteBonus}
        />
      ),
    },
  ];

  // Define columns for the external bonuses table
  const externalBonusColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "Name", accessor: "name" },
    { Header: "Description", accessor: "description" },
    {
      Header: "Start Date",
      accessor: "startDateTS",
      Cell: ({ value }) => new Date(value * 1000).toLocaleDateString(),
    },
    {
      Header: "End Date",
      accessor: "endDateTS",
      Cell: ({ value }) => new Date(value * 1000).toLocaleDateString(),
    },
  ];

  // Transform the internal bonuses data
  const bonusRows = bonuses.map((b) => ({
    bonusId: b.bonusId,
    name: b.name,
    description: b.description,
    portalId: b.portalId,
    maxAmount: b.maxAmount,
    percentage: b.percentage,
    bonusType: b.bonusType,
    actions: b.bonusId,
  }));

  // Transform the external bonuses data
  const externalBonusRows = externalBonuses.map((extB) => ({
    id: extB.id,
    name: extB.name,
    description: extB.description,
    startDateTS: extB.startDateTS,
    endDateTS: extB.endDateTS,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          {/* Internal Bonuses Table */}
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
                  Bonuses
                </MDTypography>
                <Button variant="contained" color="primary" onClick={handleAddBonus}>
                  Add Bonus
                </Button>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns: bonusColumns, rows: bonusRows }}
                  isSorted
                  entriesPerPage
                  showTotalEntries
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>

          {/* External Bonuses Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox
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
                  External Bonuses
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns: externalBonusColumns, rows: externalBonusRows }}
                  isSorted
                  entriesPerPage
                  showTotalEntries
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* ADD / EDIT BONUS DIALOG */}
      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentBonus?.bonusId ? "Edit Bonus" : "Add Bonus"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={currentBonus?.name || ""}
            onChange={(e) => setCurrentBonus({ ...currentBonus, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            variant="outlined"
            value={currentBonus?.description || ""}
            onChange={(e) => setCurrentBonus({ ...currentBonus, description: e.target.value })}
          />

          {/* Portal Dropdown */}
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel id="portal-select-label">Portal</InputLabel>
            <Select
              labelId="portal-select-label"
              value={currentBonus?.portalId || ""}
              onChange={(e) => setCurrentBonus({ ...currentBonus, portalId: e.target.value })}
              label="Portal"
            >
              {portals.map((portal) => (
                <MenuItem key={portal.id} value={portal.id}>
                  {portal.domainName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Max Amount */}
          <TextField
            label="Max Amount"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={currentBonus?.maxAmount || ""}
            inputProps={{ min: 0 }}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val >= 0) {
                setCurrentBonus({ ...currentBonus, maxAmount: val });
              }
            }}
            helperText="Enter a positive number for max amount"
          />

          {/* Percentage */}
          <TextField
            label="Percentage"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={currentBonus?.percentage || ""}
            inputProps={{ min: 0, max: 100 }}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val >= 0 && val <= 100) {
                setCurrentBonus({ ...currentBonus, percentage: val });
              }
            }}
            helperText="Enter a value between 0 and 100"
          />

          {/* Bonus Type + Parent Bonus */}
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="bonus-type-label">Bonus Type</InputLabel>
            <Select
              labelId="bonus-type-label"
              value={currentBonus?.bonusType || ""}
              onChange={(e) => {
                const type = e.target.value;
                // reset partner bonus
                setCurrentBonus({ ...currentBonus, bonusType: type, partnerBonusId: "" });

                // Filter by 'type' from the external bonus response
                const filtered = externalBonuses.filter(
                  (extBonus) => extBonus.type === parseInt(type, 10)
                );
                setFilteredExternalBonuses(filtered);
              }}
              label="Bonus Type"
            >
              <MenuItem value="2">WAGERING_BONUS</MenuItem>
              <MenuItem value="5">FREE_BET</MenuItem>
              <MenuItem value="6">FREE_SPIN</MenuItem>
            </Select>
          </FormControl>

          {/* Conditionally show Parent Bonus dropdown if there's a filtered list */}
          {filteredExternalBonuses.length > 0 && (
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="parent-bonus-label">Parent Bonus</InputLabel>
              <Select
                labelId="parent-bonus-label"
                value={currentBonus?.partnerBonusId || ""}
                onChange={(e) =>
                  setCurrentBonus({
                    ...currentBonus,
                    partnerBonusId: e.target.value,
                  })
                }
                label="Parent Bonus"
              >
                {filteredExternalBonuses.map((eb) => (
                  <MenuItem key={eb.id} value={eb.id}>
                    {eb.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveBonus} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

// Optional prop types for row objects
BonusesManagement.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      bonusId: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string,
      portalId: PropTypes.number,
      maxAmount: PropTypes.number,
      percentage: PropTypes.number,
      bonusType: PropTypes.string,
    }),
  }),
};

export default BonusesManagement;
