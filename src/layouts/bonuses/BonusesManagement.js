import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios, { extractErrorMessage } from "index";
import { useNavigate } from "react-router-dom";

// Soft UI components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// API Endpoints
const BONUSES_API = "http://localhost:8080/api/bonuses";
const PORTALS_API = "http://localhost:8080/api/portal";

/**
 * Action Menu for each bonus row:
 * - View Details
 * - Edit
 * - Delete
 */
function ActionMenu({ bonus, onEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    navigate(`/bonuses/${bonus.bonusId}/details`);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit(bonus);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(bonus.bonusId);
    handleMenuClose();
  };

  return (
    <>
      <IconButton onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </>
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

/**
 * Bonuses Management Page
 * Handles CRUD operations for "bonuses", plus optional partner bonus link.
 */
function BonusesManagement() {
  // Data states
  const [bonuses, setBonuses] = useState([]);
  const [externalBonuses, setExternalBonuses] = useState([]);
  const [filteredExternalBonuses, setFilteredExternalBonuses] = useState([]);
  const [portals, setPortals] = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & validation states
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentBonus, setCurrentBonus] = useState(null);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const navigate = useNavigate();

  /**********************************************************
   * EFFECTS - FETCH ALL DATA ON MOUNT
   **********************************************************/
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("Authorization token not found in sessionStorage.");
      setLoading(false);
      return;
    }

    Promise.all([fetchBonuses(token), fetchExternalBonuses(token), fetchPortals(token)])
      .catch((err) => {
        console.error("Error loading initial data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Fetch the list of existing (internal) bonuses.
   */
  const fetchBonuses = async (token) => {
    try {
      const response = await axios.get(BONUSES_API, {
        headers: { Authorization: token },
      });
      setBonuses(response.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  /**
   * Fetch external bonuses if needed for referencing in "partnerBonusId".
   */
  const fetchExternalBonuses = async (token) => {
    try {
      const response = await axios.get(`${BONUSES_API}/external`, {
        headers: { Authorization: token },
      });
      setExternalBonuses(response.data);
    } catch (err) {
      console.error("Error fetching external bonuses:", err);
      // Do not block the page if external bonuses are missing.
      setError(extractErrorMessage(err));
    }
  };

  /**
   * Fetch the list of portals (for the Portal dropdown).
   */
  const fetchPortals = async (token) => {
    try {
      const response = await axios.get(PORTALS_API, {
        headers: { Authorization: token },
      });
      setPortals(response.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  /**********************************************************
   * CRUD HANDLERS
   **********************************************************/
  // "Add Bonus" initiates a blank form
  const handleAddBonus = () => {
    setCurrentBonus({
      bonusId: null,
      name: "",
      description: "",
      portalId: "",
      maxAmount: "",
      percentage: "",
      bonusType: "",
      partnerBonusId: "",
    });
    setFilteredExternalBonuses([]);
    setValidationAttempted(false);
    setDialogOpen(true);
  };

  // Edit an existing bonus
  const handleEditBonus = (bonus) => {
    setCurrentBonus(bonus);
    setValidationAttempted(false);

    // Filter external bonuses if bonus type is available.
    if (bonus.bonusType) {
      const filtered = externalBonuses.filter(
        (ext) => parseInt(ext.type, 10) === parseInt(bonus.bonusType, 10)
      );
      setFilteredExternalBonuses(filtered);
    } else {
      setFilteredExternalBonuses([]);
    }

    setDialogOpen(true);
  };

  // Delete an existing bonus
  const handleDeleteBonus = async (bonusId) => {
    try {
      await axios.delete(`${BONUSES_API}/${bonusId}`, {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setBonuses((prev) => prev.filter((b) => b.bonusId !== bonusId));
    } catch (err) {
      console.error("Error deleting bonus:", err);
      setError(extractErrorMessage(err));
    }
  };

  // Validate fields before saving
  const isFieldEmpty = (fieldValue) =>
    fieldValue === undefined || fieldValue === null || fieldValue.toString().trim() === "";

  const handleSaveBonus = async () => {
    setValidationAttempted(true);

    if (!currentBonus) return;

    const { name, description, portalId, maxAmount, percentage, bonusType, partnerBonusId } =
      currentBonus;

    // 1. Check required fields.
    if (
      isFieldEmpty(name) ||
      isFieldEmpty(description) ||
      isFieldEmpty(portalId) ||
      maxAmount === "" ||
      percentage === "" ||
      isFieldEmpty(bonusType)
    ) {
      return;
    }
    // 2. If external bonuses are available, ensure partnerBonusId is provided.
    if (filteredExternalBonuses.length > 0 && isFieldEmpty(partnerBonusId)) {
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      if (currentBonus.bonusId) {
        // Update existing bonus.
        const res = await axios.put(`${BONUSES_API}/${currentBonus.bonusId}`, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) => prev.map((b) => (b.bonusId === currentBonus.bonusId ? res.data : b)));
      } else {
        // Create new bonus.
        const res = await axios.post(BONUSES_API, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) => [...prev, res.data]);
      }

      setDialogOpen(false);
      setCurrentBonus(null);
      setValidationAttempted(false);
    } catch (err) {
      console.error("Error saving bonus:", err);
      setError(extractErrorMessage(err));
    }
  };

  /**********************************************************
   * TABLE DEFINITIONS
   **********************************************************/
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
      Header: "Icon",
      accessor: "iconImageBase64",
      Cell: ({ value }) =>
        value ? (
          <img
            src={`data:image/png;base64,${value}`}
            alt="Bonus Icon"
            style={{ width: "40px", height: "40px" }}
          />
        ) : (
          "No Icon"
        ),
    },
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

  // Transform bonuses data into rows for DataTable.
  const bonusRows = bonuses.map((b) => ({
    bonusId: b.bonusId,
    name: b.name,
    description: b.description,
    portalId: b.portalId,
    maxAmount: b.maxAmount,
    percentage: b.percentage,
    bonusType: b.bonusType,
    iconImageBase64: b.iconImageBase64,
    actions: b.bonusId,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center">
          <CircularProgress />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

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
        </Grid>
      </MDBox>
      <Footer />

      {/* CREATE / EDIT BONUS DIALOG */}
      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentBonus?.bonusId ? "Edit Bonus" : "Add Bonus"}</DialogTitle>
        <DialogContent>
          {/* NAME */}
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={currentBonus?.name || ""}
            onChange={(e) => setCurrentBonus({ ...currentBonus, name: e.target.value })}
            error={
              validationAttempted &&
              (isFieldEmpty(currentBonus?.name) || currentBonus?.name.trim() === "")
            }
            helperText={
              validationAttempted &&
              (isFieldEmpty(currentBonus?.name) || currentBonus?.name.trim() === "")
                ? "Name is required."
                : ""
            }
          />

          {/* DESCRIPTION */}
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            variant="outlined"
            value={currentBonus?.description || ""}
            onChange={(e) => setCurrentBonus({ ...currentBonus, description: e.target.value })}
            error={
              validationAttempted &&
              (isFieldEmpty(currentBonus?.description) || currentBonus?.description.trim() === "")
            }
            helperText={
              validationAttempted &&
              (isFieldEmpty(currentBonus?.description) || currentBonus?.description.trim() === "")
                ? "Description is required."
                : ""
            }
          />

          {/* PORTAL SELECT */}
          <FormControl
            fullWidth
            margin="normal"
            variant="outlined"
            error={validationAttempted && isFieldEmpty(currentBonus?.portalId)}
          >
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
            {validationAttempted && isFieldEmpty(currentBonus?.portalId) && (
              <MDTypography variant="caption" color="error">
                Portal is required.
              </MDTypography>
            )}
          </FormControl>

          {/* MAX AMOUNT */}
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
              if (!isNaN(val) && val >= 0) {
                setCurrentBonus({ ...currentBonus, maxAmount: val });
              } else {
                setCurrentBonus({ ...currentBonus, maxAmount: "" });
              }
            }}
            error={
              validationAttempted && (currentBonus?.maxAmount === "" || currentBonus?.maxAmount < 0)
            }
            helperText={
              validationAttempted && (currentBonus?.maxAmount === "" || currentBonus?.maxAmount < 0)
                ? "Max Amount is required and must be positive."
                : "Enter a positive number for max amount."
            }
          />

          {/* PERCENTAGE */}
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
              if (!isNaN(val) && val >= 0 && val <= 100) {
                setCurrentBonus({ ...currentBonus, percentage: val });
              } else {
                setCurrentBonus({ ...currentBonus, percentage: "" });
              }
            }}
            error={
              validationAttempted &&
              (currentBonus?.percentage === "" ||
                currentBonus?.percentage < 0 ||
                currentBonus?.percentage > 100)
            }
            helperText={
              validationAttempted &&
              (currentBonus?.percentage === "" ||
                currentBonus?.percentage < 0 ||
                currentBonus?.percentage > 100)
                ? "Percentage is required and must be between 0 and 100."
                : "Enter a value between 0 and 100."
            }
          />

          {/* BONUS TYPE */}
          <FormControl
            fullWidth
            variant="outlined"
            margin="normal"
            error={validationAttempted && isFieldEmpty(currentBonus?.bonusType)}
          >
            <InputLabel id="bonus-type-label">Bonus Type</InputLabel>
            <Select
              labelId="bonus-type-label"
              value={currentBonus?.bonusType || ""}
              onChange={(e) => {
                const typeVal = e.target.value;
                setCurrentBonus({
                  ...currentBonus,
                  bonusType: typeVal,
                  partnerBonusId: "",
                });
                const filtered = externalBonuses.filter(
                  (extB) => parseInt(extB.type, 10) === parseInt(typeVal, 10)
                );
                setFilteredExternalBonuses(filtered);
              }}
              label="Bonus Type"
            >
              <MenuItem value="2">WAGERING_BONUS</MenuItem>
              <MenuItem value="5">FREE_BET</MenuItem>
              <MenuItem value="6">FREE_SPIN</MenuItem>
            </Select>
            {validationAttempted && isFieldEmpty(currentBonus?.bonusType) && (
              <MDTypography variant="caption" color="error">
                Bonus Type is required.
              </MDTypography>
            )}
          </FormControl>

          {/* CONDITIONAL PARENT BONUS SELECT */}
          {filteredExternalBonuses.length > 0 && (
            <FormControl
              fullWidth
              variant="outlined"
              margin="normal"
              error={validationAttempted && isFieldEmpty(currentBonus?.partnerBonusId)}
            >
              <InputLabel id="parent-bonus-label">Parent Bonus</InputLabel>
              <Select
                labelId="parent-bonus-label"
                value={currentBonus?.partnerBonusId || ""}
                onChange={(e) =>
                  setCurrentBonus({ ...currentBonus, partnerBonusId: e.target.value })
                }
                label="Parent Bonus"
              >
                {filteredExternalBonuses.map((eb) => (
                  <MenuItem key={eb.id} value={eb.id}>
                    {eb.name}
                  </MenuItem>
                ))}
              </Select>
              {validationAttempted && isFieldEmpty(currentBonus?.partnerBonusId) && (
                <MDTypography variant="caption" color="error">
                  Parent Bonus is required.
                </MDTypography>
              )}
            </FormControl>
          )}

          {/* IMAGE UPLOAD */}
          <input
            type="file"
            accept="image/png, image/gif"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result.replace("data:", "").replace(/^.+,/, "");
                setCurrentBonus({ ...currentBonus, iconImageBase64: base64String });
              };
              reader.readAsDataURL(file);
            }}
          />

          {/* Preview uploaded image */}
          {currentBonus?.iconImageBase64 && (
            <img
              src={`data:image/png;base64,${currentBonus.iconImageBase64}`}
              alt="bonus icon preview"
              style={{ width: "80px", height: "80px", marginTop: "1rem" }}
            />
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

      {/* Snackbar for error notifications */}
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
