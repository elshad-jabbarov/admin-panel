import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable"; // Adjusted import path

const BONUSES_API = "http://localhost:8080/api/bonuses";

function ActionMenu({ rule, onEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            onEdit(rule);
            handleClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(rule.ruleId);
            handleClose();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

ActionMenu.propTypes = {
  rule: PropTypes.shape({
    ruleId: PropTypes.number.isRequired,
    ruleKey: PropTypes.string,
    ruleOperator: PropTypes.string,
    ruleValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function ActionsCell({ row, onEdit, onDelete }) {
  return <ActionMenu rule={row.original} onEdit={onEdit} onDelete={onDelete} />;
}

ActionsCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      ruleId: PropTypes.number.isRequired,
      ruleKey: PropTypes.string,
      ruleOperator: PropTypes.string,
      ruleValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    }).isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function BonusDetails() {
  const { bonusId } = useParams();
  const navigate = useNavigate();
  const [bonus, setBonus] = useState(null);
  const [rules, setRules] = useState([]);
  const [ruleCombinations, setRuleCombinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [selectedRuleKey, setSelectedRuleKey] = useState("");
  const [validOperators, setValidOperators] = useState([]);
  const [valueType, setValueType] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("Authorization token not found.");
      setError("Authorization token not found.");
      setLoading(false);
      return;
    }
    axios
      .get(`${BONUSES_API}/${bonusId}`, { headers: { Authorization: `${token}` } })
      .then((response) => {
        console.log("Bonus details response:", response.data);
        setBonus(response.data);
        setRules(response.data.rules || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching bonus details:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
        setError("Failed to load bonus details.");
        setLoading(false);
      });
  }, [bonusId]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("Authorization token not found.");
      setError("Authorization token not found.");
      return;
    }
    axios
      .get(`${BONUSES_API}/rules/combinations`, {
        headers: { Authorization: `${token}` },
      })
      .then((response) => {
        setRuleCombinations(response.data);
      })
      .catch((error) => {
        console.error("Error fetching rule combinations:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
      });
  }, []);

  useEffect(() => {
    if (currentRule && currentRule.ruleKey) {
      setSelectedRuleKey(currentRule.ruleKey);
      const combination = ruleCombinations.find((rc) => rc.ruleKey === currentRule.ruleKey);
      if (combination) {
        setValidOperators(combination.validOperators);
        setValueType(combination.valueType);
      } else {
        setValidOperators([]);
        setValueType("");
      }
    } else {
      setSelectedRuleKey("");
      setValidOperators([]);
      setValueType("");
    }
  }, [currentRule, ruleCombinations]);

  const goBack = () => navigate(-1);

  const handleEdit = (rule) => {
    setCurrentRule(rule);
    setSelectedRuleKey(rule.ruleKey);
    const combination = ruleCombinations.find((rc) => rc.ruleKey === rule.ruleKey);
    if (combination) {
      setValidOperators(combination.validOperators);
      setValueType(combination.valueType);
    } else {
      setValidOperators([]);
      setValueType("");
    }
    setDialogOpen(true);
  };

  const handleDelete = (ruleId) => {
    const token = sessionStorage.getItem("token");
    axios
      .delete(`${BONUSES_API}/${bonusId}/rules/${ruleId}`, {
        headers: { Authorization: `${token}` },
      })
      .then(() => {
        setRules((prevRules) => prevRules.filter((rule) => rule.ruleId !== ruleId));
      })
      .catch((error) => {
        console.error("Error deleting rule:", error);
      });
  };

  const handleSave = () => {
    // Perform validation
    if (!currentRule.ruleKey) {
      alert("Please select a Rule Key.");
      return;
    }
    if (!currentRule.ruleOperator) {
      alert("Please select an Operator.");
      return;
    }
    // For BOOLEAN type, ruleValue should be true or false
    if (valueType === "BOOLEAN" && typeof currentRule.ruleValue !== "boolean") {
      alert("Please set the rule value.");
      return;
    }
    // For NUMBER type, ruleValue should be a number
    if (valueType === "NUMBER" && (currentRule.ruleValue === "" || isNaN(currentRule.ruleValue))) {
      alert("Please enter a valid number for the rule value.");
      return;
    }
    // For RANGE type, need to implement proper validation
    if (valueType === "RANGE") {
      alert("Range rules are not supported yet.");
      return;
    }

    const token = sessionStorage.getItem("token");
    const request = currentRule.ruleId
      ? axios.put(`${BONUSES_API}/${bonusId}/rules/${currentRule.ruleId}`, currentRule, {
          headers: { Authorization: `${token}` },
        })
      : axios.post(`${BONUSES_API}/${bonusId}/rules`, currentRule, {
          headers: { Authorization: `${token}` },
        });

    request
      .then((response) => {
        if (currentRule.ruleId) {
          setRules((prevRules) =>
            prevRules.map((rule) => (rule.ruleId === currentRule.ruleId ? response.data : rule))
          );
        } else {
          setRules((prevRules) => [...prevRules, response.data]);
        }
        setDialogOpen(false);
        setCurrentRule(null);
      })
      .catch((error) => {
        console.error("Error saving rule:", error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert("An error occurred while saving the rule.");
        }
      });
  };

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

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center">
          <MDTypography variant="h6" color="error">
            {error}
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!bonus) {
    return null; // Or handle accordingly
  }

  const columns = [
    { Header: "Rule Key", accessor: "ruleKey" },
    { Header: "Operator", accessor: "ruleOperator" },
    { Header: "Value", accessor: "ruleValue" },
    {
      Header: "Actions",
      accessor: "ruleId",
      Cell: (cellProps) => (
        <ActionsCell row={cellProps.row} onEdit={handleEdit} onDelete={handleDelete} />
      ),
    },
  ];

  const rows = rules.map((rule) => ({
    ruleKey: rule.ruleKey,
    ruleOperator: rule.ruleOperator,
    ruleValue:
      rule.ruleValue !== null && rule.ruleValue !== undefined ? rule.ruleValue.toString() : "N/A",
    ruleId: rule.ruleId,
    original: rule, // To be used in ActionsCell
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
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
                <MDTypography variant="h4" color="white">
                  {bonus.name || "Unnamed Bonus"}
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                <MDTypography variant="h6">Description</MDTypography>
                <MDTypography variant="body2" mb={2}>
                  {bonus.description || "No description available."}
                </MDTypography>

                <MDTypography variant="h6">Rules</MDTypography>
                <DataTable
                  table={{ columns, rows }}
                  entriesPerPage={{ defaultValue: 5, entries: [5, 10, 15] }}
                  canSearch
                  showTotalEntries
                  isSorted
                  pagination
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setCurrentRule({ ruleKey: "", ruleOperator: "", ruleValue: "" });
                    setSelectedRuleKey("");
                    setValidOperators([]);
                    setValueType("");
                    setDialogOpen(true);
                  }}
                  style={{ marginRight: "10px", marginTop: "10px" }}
                >
                  Add Rule
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={goBack}
                  style={{ marginTop: "10px" }}
                >
                  Back
                </Button>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentRule?.ruleId ? "Edit Rule" : "Add Rule"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Rule Key Field */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="rule-key-label">Rule Key</InputLabel>
                <Select
                  labelId="rule-key-label"
                  id="rule-key-select"
                  value={currentRule?.ruleKey || ""}
                  onChange={(e) => {
                    const selectedKey = e.target.value;
                    setCurrentRule((prev) => ({
                      ...prev,
                      ruleKey: selectedKey,
                      ruleOperator: "",
                      ruleValue: "",
                    }));
                    setSelectedRuleKey(selectedKey);
                    const combination = ruleCombinations.find((rc) => rc.ruleKey === selectedKey);
                    if (combination) {
                      setValidOperators(combination.validOperators);
                      setValueType(combination.valueType);
                    } else {
                      setValidOperators([]);
                      setValueType("");
                    }
                  }}
                  label="Rule Key"
                >
                  {ruleCombinations.map((combination) => (
                    <MenuItem key={combination.ruleKey} value={combination.ruleKey}>
                      {combination.ruleKey}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Operator Field */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                variant="outlined"
                margin="normal"
                disabled={!validOperators.length}
              >
                <InputLabel id="operator-label">Operator</InputLabel>
                <Select
                  labelId="operator-label"
                  id="operator-select"
                  value={currentRule?.ruleOperator || ""}
                  onChange={(e) => {
                    const selectedOperator = e.target.value;
                    setCurrentRule((prev) => ({ ...prev, ruleOperator: selectedOperator }));
                  }}
                  label="Operator"
                >
                  {validOperators.map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {operator}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Value Field */}
            {valueType === "BOOLEAN" && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentRule?.ruleValue === true}
                      onChange={(e) =>
                        setCurrentRule((prev) => ({ ...prev, ruleValue: e.target.checked }))
                      }
                    />
                  }
                  label="Value"
                />
              </Grid>
            )}

            {valueType === "NUMBER" && (
              <Grid item xs={12}>
                <TextField
                  label="Value"
                  type="number"
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  value={currentRule?.ruleValue || ""}
                  onChange={(e) =>
                    setCurrentRule((prev) => ({ ...prev, ruleValue: parseFloat(e.target.value) }))
                  }
                />
              </Grid>
            )}

            {valueType === "RANGE" && (
              <Grid item xs={12}>
                <MDTypography variant="body2" color="textSecondary">
                  Range rules are not supported in this dialog yet.
                </MDTypography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

BonusDetails.propTypes = {
  bonusId: PropTypes.string,
};

export default BonusDetails;
