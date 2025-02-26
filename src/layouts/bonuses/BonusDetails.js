import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import axios, { extractErrorMessage } from "index";

// Material UI components
import {
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
import DeleteIcon from "@mui/icons-material/Delete"; // New import

// Custom components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Constants
const BONUSES_API = "http://localhost:8080/api/bonuses";

/**
 * ACTION MENU COMPONENT
 */
function ActionMenu({ rule, onEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEditClick = () => {
    onEdit(rule);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    onDelete(rule.ruleId);
    handleMenuClose();
  };

  return (
    <div style={{ position: "relative" }}>
      <IconButton onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} keepMounted>
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
    </div>
  );
}

ActionMenu.propTypes = {
  rule: PropTypes.shape({
    ruleId: PropTypes.number.isRequired,
    ruleKey: PropTypes.string.isRequired,
    ruleOperator: PropTypes.string,
    ruleValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    ruleOrder: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/**
 * ACTIONS CELL COMPONENT
 */
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
      ruleOrder: PropTypes.number,
    }).isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/**
 * BONUS DETAILS PAGE
 */
function BonusDetails() {
  const { bonusId } = useParams();
  const navigate = useNavigate();

  // Bonus and rules data
  const [bonus, setBonus] = useState(null);
  const [rules, setRules] = useState([]);
  const [ruleCombinations, setRuleCombinations] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & form states
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [selectedRuleKey, setSelectedRuleKey] = useState("");
  const [validOperators, setValidOperators] = useState([]);
  const [valueType, setValueType] = useState("");
  const [formError, setFormError] = useState("");

  // Fetch bonus details & rules
  useEffect(() => {
    const fetchBonusDetails = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("Authorization token not found.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${BONUSES_API}/${bonusId}`, {
          headers: { Authorization: token },
        });
        const fetchedBonus = response.data;
        const mappedRules = (fetchedBonus.rules || []).map((rule) => ({
          ...rule,
          ruleId: rule.id,
          ruleOrder: rule.ruleOrder || 0,
          // Ensure rangeRules is always an array—even if empty
          rangeRules: rule.rangeRules || [],
        }));
        setBonus(fetchedBonus);
        setRules(mappedRules);
      } catch (err) {
        console.error("Bonus details error:", err);
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchBonusDetails();
  }, [bonusId]);

  // Fetch rule key/operator combinations
  useEffect(() => {
    const fetchRuleCombinations = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("Authorization token not found.");
        return;
      }
      try {
        const res = await axios.get(`${BONUSES_API}/rules/combinations`, {
          headers: { Authorization: token },
        });
        setRuleCombinations(res.data);
      } catch (err) {
        console.error("Rule combinations error:", err);
      }
    };
    fetchRuleCombinations();
  }, []);

  // Update valid operators and value type when currentRule changes
  useEffect(() => {
    if (currentRule && currentRule.ruleKey) {
      const combination = ruleCombinations.find((rc) => rc.ruleKey === currentRule.ruleKey);
      if (combination) {
        setValidOperators(combination.validOperators);
        setValueType(combination.valueType);
        // For RANGE rules, only auto-populate an empty row if we are creating a new rule.
        if (
          combination.valueType === "RANGE" &&
          !currentRule.ruleId && // not editing
          (!currentRule.rangeRules || currentRule.rangeRules.length === 0)
        ) {
          setCurrentRule((prev) => ({
            ...prev,
            rangeRules: [{ minValue: "", maxValue: "", rewardValue: "" }],
          }));
        }
      } else {
        setValidOperators([]);
        setValueType("");
      }
    } else {
      setSelectedRuleKey("");
      setValidOperators([]);
      setValueType("");
    }
    setFormError("");
  }, [currentRule, ruleCombinations]);

  // Range Rule handlers
  const handleAddRangeRule = () => {
    const newRangeRule = { minValue: "", maxValue: "", rewardValue: "" };
    setCurrentRule((prev) => ({
      ...prev,
      rangeRules: prev.rangeRules ? [...prev.rangeRules, newRangeRule] : [newRangeRule],
    }));
  };

  const handleRangeRuleChange = (index, field, value) => {
    setCurrentRule((prev) => {
      const updatedRangeRules = prev.rangeRules.map((rule, idx) =>
        idx === index ? { ...rule, [field]: value } : rule
      );
      return { ...prev, rangeRules: updatedRangeRules };
    });
  };

  const handleRemoveRangeRule = (index) => {
    setCurrentRule((prev) => {
      const updatedRangeRules = prev.rangeRules.filter((_, idx) => idx !== index);
      return { ...prev, rangeRules: updatedRangeRules };
    });
  };

  const goBack = () => navigate(-1);

  const handleEditRule = (rule) => {
    setCurrentRule(rule);
    setSelectedRuleKey(rule.ruleKey);
    setDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId) => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.delete(`${BONUSES_API}/${bonusId}/rules/${ruleId}`, {
        headers: { Authorization: token },
      });
      setRules((prevRules) => prevRules.filter((r) => r.ruleId !== ruleId));
    } catch (err) {
      console.error("Error deleting rule:", err);
      setFormError(extractErrorMessage(err));
    }
  };

  const validateRule = () => {
    if (!currentRule.ruleKey) return "Please select a Rule Key.";
    if (!currentRule.ruleOperator) return "Please select an Operator.";

    const operatorOnly = ["IS_TRUE", "IS_FALSE"].includes(currentRule.ruleOperator);

    if (valueType === "BOOLEAN" && !operatorOnly) {
      if (typeof currentRule.ruleValue !== "boolean") {
        return "Please set the boolean value (checked or unchecked).";
      }
    }

    if (valueType === "NUMBER" && !operatorOnly) {
      if (currentRule.ruleValue === "" || isNaN(currentRule.ruleValue)) {
        return "Please enter a valid number for the rule value.";
      }
    }

    if (currentRule.ruleOrder === "" || isNaN(currentRule.ruleOrder)) {
      return "Please enter a valid numeric value for Rule Order.";
    }

    // Optionally add validation for each range rule if valueType is RANGE
    if (valueType === "RANGE") {
      if (!currentRule.rangeRules || currentRule.rangeRules.length === 0) {
        return "Please add at least one range rule.";
      }
      for (let i = 0; i < currentRule.rangeRules.length; i++) {
        const rr = currentRule.rangeRules[i];
        if (rr.minValue === "" || isNaN(rr.minValue)) {
          return `Please enter a valid minimum value for range rule ${i + 1}.`;
        }
        if (rr.maxValue === "" || isNaN(rr.maxValue)) {
          return `Please enter a valid maximum value for range rule ${i + 1}.`;
        }
        if (rr.rewardValue === "" || isNaN(rr.rewardValue)) {
          return `Please enter a valid reward value for range rule ${i + 1}.`;
        }
      }
    }

    return "";
  };

  const handleSaveRule = async () => {
    if (!currentRule) return;
    const validationMsg = validateRule();
    if (validationMsg) {
      setFormError(validationMsg);
      return;
    }

    const payload = { ...currentRule };
    if (["IS_TRUE", "IS_FALSE"].includes(currentRule.ruleOperator)) {
      delete payload.ruleValue;
    }

    const token = sessionStorage.getItem("token");
    const isEditing = !!currentRule.ruleId;
    try {
      const res = isEditing
        ? await axios.put(`${BONUSES_API}/${bonusId}/rules/${currentRule.ruleId}`, payload, {
            headers: { Authorization: token },
          })
        : await axios.post(`${BONUSES_API}/${bonusId}/rules`, payload, {
            headers: { Authorization: token },
          });
      if (isEditing) {
        setRules((prevRules) =>
          prevRules.map((r) => (r.ruleId === currentRule.ruleId ? res.data : r))
        );
      } else {
        setRules((prevRules) => [...prevRules, { ...res.data, ruleId: res.data.id }]);
      }
      setDialogOpen(false);
      setCurrentRule(null);
      setFormError("");
    } catch (err) {
      console.error("Error saving rule:", err);
      setFormError(extractErrorMessage(err));
    }
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

  if (!bonus) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center">
          <MDTypography variant="h6">No bonus data available.</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const columns = [
    { Header: "Rule Key", accessor: "ruleKey" },
    { Header: "Operator", accessor: "ruleOperator" },
    { Header: "Value", accessor: "ruleValue" },
    { Header: "Order", accessor: "ruleOrder" },
    {
      Header: "Actions",
      accessor: "ruleId",
      Cell: (cellProps) => (
        <ActionsCell row={cellProps.row} onEdit={handleEditRule} onDelete={handleDeleteRule} />
      ),
    },
  ];

  const rows = rules.map((rule) => ({
    ruleKey: rule.ruleKey,
    ruleOperator: rule.ruleOperator,
    ruleValue:
      rule.ruleValue !== null && rule.ruleValue !== undefined ? rule.ruleValue.toString() : "N/A",
    ruleOrder: rule.ruleOrder !== undefined ? rule.ruleOrder : "0",
    ruleId: rule.ruleId,
    original: rule,
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

                <MDTypography variant="h6" mb={1}>
                  Rules
                </MDTypography>
                <DataTable
                  table={{ columns, rows }}
                  entriesPerPage={{ defaultValue: 5, entries: [5, 10, 15] }}
                  canSearch
                  showTotalEntries
                  isSorted
                  pagination
                />

                <MDBox mt={2} display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setCurrentRule({
                        ruleKey: "",
                        ruleOperator: "",
                        ruleValue: "",
                        ruleOrder: 0,
                        // Initialize rangeRules if necessary
                        rangeRules: [],
                      });
                      setSelectedRuleKey("");
                      setValidOperators([]);
                      setValueType("");
                      setDialogOpen(true);
                      setFormError("");
                    }}
                  >
                    Add Rule
                  </Button>
                  <Button variant="contained" color="secondary" onClick={goBack}>
                    Back
                  </Button>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Add/Edit Rule Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentRule?.ruleId ? "Edit Rule" : "Add Rule"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {formError && (
              <Grid item xs={12}>
                <MDTypography variant="caption" color="error">
                  {formError}
                </MDTypography>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="rule-key-label">Rule Key</InputLabel>
                <Select
                  labelId="rule-key-label"
                  id="rule-key-select"
                  value={currentRule?.ruleKey || ""}
                  onChange={(e) => {
                    const selectedKey = e.target.value;
                    const combination = ruleCombinations.find((rc) => rc.ruleKey === selectedKey);
                    setCurrentRule((prev) => ({
                      ...prev,
                      ruleKey: selectedKey,
                      ruleOperator: "",
                      ruleValue: "",
                      ruleOrder: prev.ruleId ? prev.ruleOrder : 0,
                      // If the new type is RANGE and we’re adding a new rule (no ruleId), initialize with one empty row.
                      rangeRules:
                        combination?.valueType === "RANGE"
                          ? prev.ruleId
                            ? prev.rangeRules
                            : [{ minValue: "", maxValue: "", rewardValue: "" }]
                          : prev.rangeRules,
                    }));
                    setSelectedRuleKey(selectedKey);
                    setValidOperators(combination?.validOperators || []);
                    setValueType(combination?.valueType || "");
                    setFormError("");
                  }}
                  label="Rule Key"
                  disabled={Boolean(currentRule?.ruleId)}
                >
                  {ruleCombinations.map((combination) => (
                    <MenuItem key={combination.ruleKey} value={combination.ruleKey}>
                      {combination.ruleKey}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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
                    setCurrentRule((prev) => ({
                      ...prev,
                      ruleOperator: e.target.value,
                      ruleValue: ["IS_TRUE", "IS_FALSE"].includes(e.target.value)
                        ? ""
                        : prev.ruleValue,
                    }));
                    setFormError("");
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

            {valueType === "BOOLEAN" &&
              currentRule?.ruleOperator !== "IS_TRUE" &&
              currentRule?.ruleOperator !== "IS_FALSE" && (
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
                    label="Value (Checked = True, Unchecked = False)"
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
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value);
                    setCurrentRule((prev) => ({ ...prev, ruleValue: numValue }));
                    setFormError("");
                  }}
                />
              </Grid>
            )}

            {valueType === "RANGE" && (
              <>
                <Grid item xs={12}>
                  <MDTypography variant="h6">Range Rules</MDTypography>
                </Grid>
                {currentRule?.rangeRules &&
                  currentRule.rangeRules.map((rangeRule, index) => (
                    <Grid container spacing={2} key={index} alignItems="center">
                      <Grid item xs={4}>
                        <TextField
                          label="Min Value"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={rangeRule.minValue || ""}
                          onChange={(e) =>
                            handleRangeRuleChange(index, "minValue", parseFloat(e.target.value))
                          }
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Max Value"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={rangeRule.maxValue || ""}
                          onChange={(e) =>
                            handleRangeRuleChange(index, "maxValue", parseFloat(e.target.value))
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Reward Value"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={rangeRule.rewardValue || ""}
                          onChange={(e) =>
                            handleRangeRuleChange(index, "rewardValue", parseFloat(e.target.value))
                          }
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton onClick={() => handleRemoveRangeRule(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddRangeRule}>
                    Add Range Rule
                  </Button>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Rule Order"
                type="number"
                fullWidth
                variant="outlined"
                margin="normal"
                value={currentRule?.ruleOrder || ""}
                onChange={(e) => {
                  const orderValue = parseInt(e.target.value, 10);
                  setCurrentRule((prev) => ({
                    ...prev,
                    ruleOrder: isNaN(orderValue) ? 0 : orderValue,
                  }));
                  setFormError("");
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setFormError("");
            }}
            color="secondary"
          >
            Cancel
          </Button>
          <Button onClick={handleSaveRule} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!error || !!formError}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setFormError("");
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => {
            setError(null);
            setFormError("");
          }}
          severity="error"
          variant="filled"
        >
          {error || formError}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

BonusDetails.propTypes = {
  bonusId: PropTypes.string,
};

export default BonusDetails;
