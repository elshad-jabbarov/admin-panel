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
  const [bonuses, setBonuses] = useState([]);
  const [externalBonuses, setExternalBonuses] = useState([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentBonus, setCurrentBonus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBonuses();
    fetchExternalBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const response = await axios.get(BONUSES_API, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });
      setBonuses(response.data);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    }
  };

  const fetchExternalBonuses = async () => {
    try {
      const response = await axios.get(`${BONUSES_API}/external`, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });
      setExternalBonuses(response.data);
    } catch (error) {
      console.error("Error fetching external bonuses:", error);
    }
  };

  const handleAddBonus = () => {
    setCurrentBonus({
      bonusId: null,
      name: "",
      description: "",
      portalId: "",
      maxAmount: "",
      percentage: "",
      bonusType: "",
    });
    setDialogOpen(true);
  };

  const handleEditBonus = (bonus) => {
    setCurrentBonus(bonus);
    setDialogOpen(true);
  };

  const handleDeleteBonus = async (bonusId) => {
    try {
      await axios.delete(`${BONUSES_API}/${bonusId}`, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });
      setBonuses((prevBonuses) => prevBonuses.filter((bonus) => bonus.bonusId !== bonusId));
    } catch (error) {
      console.error("Error deleting bonus:", error);
    }
  };

  const handleSaveBonus = async () => {
    const token = sessionStorage.getItem("token");
    try {
      if (currentBonus.bonusId) {
        // Update existing bonus
        const response = await axios.put(`${BONUSES_API}/${currentBonus.bonusId}`, currentBonus, {
          headers: {
            Authorization: `${token}`,
          },
        });
        setBonuses((prevBonuses) =>
          prevBonuses.map((bonus) =>
            bonus.bonusId === currentBonus.bonusId ? response.data : bonus
          )
        );
      } else {
        // Create new bonus
        const response = await axios.post(BONUSES_API, currentBonus, {
          headers: {
            Authorization: `${token}`,
          },
        });
        setBonuses((prevBonuses) => [...prevBonuses, response.data]);
      }
      setDialogOpen(false);
      setCurrentBonus(null);
    } catch (error) {
      console.error("Error saving bonus:", error);
    }
  };

  const bonusColumns = [
    { Header: "Bonus ID", accessor: "bonusId" },
    { Header: "Name", accessor: "name" },
    { Header: "Description", accessor: "description" },
    { Header: "Portal ID", accessor: "portalId" },
    { Header: "Max Amount", accessor: "maxAmount" },
    { Header: "Percentage", accessor: "percentage" },
    { Header: "Bonus Type", accessor: "bonusType" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: ({ row }) => (
        <ActionMenu bonus={row.original} onEdit={handleEditBonus} onDelete={handleDeleteBonus} />
      ),
    },
  ];

  const externalBonusColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "Name", accessor: "name" },
    { Header: "Description", accessor: "description" },
    { Header: "Start Date", accessor: "startDateTS" },
    { Header: "End Date", accessor: "endDateTS" },
  ];

  const bonusRows = bonuses.map((bonus) => ({
    bonusId: bonus.bonusId,
    name: bonus.name,
    description: bonus.description,
    portalId: bonus.portalId,
    maxAmount: bonus.maxAmount,
    percentage: bonus.percentage,
    bonusType: bonus.bonusType,
    actions: bonus.bonusId,
  }));

  const externalBonusRows = externalBonuses.map((bonus) => ({
    id: bonus.id,
    name: bonus.name,
    description: bonus.description,
    startDateTS: new Date(bonus.startDateTS * 1000).toLocaleDateString(),
    endDateTS: new Date(bonus.endDateTS * 1000).toLocaleDateString(),
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
                  Bonuses
                </MDTypography>
                <Button variant="contained" color="primary" onClick={handleAddBonus}>
                  Add Bonus
                </Button>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns: bonusColumns, rows: bonusRows }}
                  isSorted={true}
                  entriesPerPage={true}
                  showTotalEntries={true}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
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
                  isSorted={true}
                  entriesPerPage={true}
                  showTotalEntries={true}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

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
          <TextField
            label="Portal ID"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={currentBonus?.portalId || ""}
            onChange={(e) =>
              setCurrentBonus({ ...currentBonus, portalId: parseInt(e.target.value, 10) })
            }
          />
          <TextField
            label="Max Amount"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={currentBonus?.maxAmount || ""}
            onChange={(e) =>
              setCurrentBonus({ ...currentBonus, maxAmount: parseFloat(e.target.value) })
            }
          />
          <TextField
            label="Percentage"
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            value={currentBonus?.percentage || ""}
            onChange={(e) =>
              setCurrentBonus({ ...currentBonus, percentage: parseFloat(e.target.value) })
            }
          />
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="bonus-type-label">Bonus Type</InputLabel>
            <Select
              labelId="bonus-type-label"
              value={currentBonus?.bonusType || ""}
              onChange={(e) => setCurrentBonus({ ...currentBonus, bonusType: e.target.value })}
              label="Bonus Type"
            >
              <MenuItem value="WAGERING_BONUS">WAGERING_BONUS</MenuItem>
              <MenuItem value="CASH_BONUS">CASH_BONUS</MenuItem>
            </Select>
          </FormControl>
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

// Define PropTypes for DataTable rows
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
