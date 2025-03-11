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
import DeleteIcon from "@mui/icons-material/Delete";

// Custom components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Constants
const BONUSES_API = `${process.env.REACT_APP_API_URL}/api/bonuses`;

// Translation mappings for ruleKeys and ruleOperators.
const RULE_TRANSLATIONS = {
  ruleKeys: {
    ACCOUNT_STATUS: "Hesap Durumu",
    DEPOSIT_AMOUNT: "Para Yatırma Miktarı",
    DEPOSIT_AMOUNT_RANGE: "Para Yatırma Miktarı Aralığı",
    TRANSACTION_AFTER_DEPOSIT: "Para Yatırmadan Sonra İşlem",
    NO_EXISTING_BONUS: "Mevcut Bonus Yok",
    NO_PROFIT_LAST_X_HOURS: "Son X Saat Kâr Yok",
    DEPOSIT_COUNT: "Para Yatırma Sayısı",
    WITHDRAWAL_COUNT: "Para Çekme Sayısı",
    WITHDRAWAL_TIME: "Para Çekme Zamanı",
    BONUS_PERCENTAGE: "Bonus Yüzdesi",
    BONUS_FREQUENCY: "Bonus Sıklığı",
    MIN_LOSS_AMOUNT: "Minimum Zarar Miktarı",
    PAYMENT_METHOD: "Ödeme Yöntemi",
    MIN_DEPOSIT_AMOUNT: "Minimum Para Yatırma Miktarı",
  },
  ruleOperators: {
    IS_TRUE: "DOĞRU",
    IS_FALSE: "YANLIŞ",
    GREATER_THAN: "BÜYÜK",
    LESS_THAN: "KÜÇÜK",
    GREATER_THAN_OR_EQUALS: "BÜYÜK VEYA EŞİT",
    EQUALS: "EŞİT",
    NOT_EQUALS: "EŞİT DEĞİL",
    RANGE: "ARALIK",
  },
};

const translateRuleKey = (key) => RULE_TRANSLATIONS.ruleKeys[key] || key;
const translateRuleOperator = (operator) => RULE_TRANSLATIONS.ruleOperators[operator] || operator;

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
        <MenuItem onClick={handleEditClick}>Düzenle</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Sil</MenuItem>
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
        setError("Yetkilendirme token'ı bulunamadı.");
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
        console.error("Bonus detayları hatası:", err);
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
        setError("Yetkilendirme token'ı bulunamadı.");
        return;
      }
      try {
        const res = await axios.get(`${BONUSES_API}/rules/combinations`, {
          headers: { Authorization: token },
        });
        setRuleCombinations(res.data);
      } catch (err) {
        console.error("Kural kombinasyonları hatası:", err);
      }
    };
    fetchRuleCombinations();
  }, []);

  useEffect(() => {
    if (currentRule && currentRule.ruleKey) {
      // Use a case-insensitive comparison for ruleKey.
      const currentRuleKey = String(currentRule.ruleKey).toUpperCase();
      const combination = ruleCombinations.find(
        (rc) => String(rc.ruleKey).toUpperCase() === currentRuleKey
      );
      if (combination) {
        // Always use the full validOperators array from the API.
        setValidOperators(combination.validOperators);
        setValueType(combination.valueType);
        // For RANGE rules, auto-populate an empty row only when adding a new rule.
        if (
          combination.valueType === "RANGE" &&
          !currentRule.ruleId &&
          (!currentRule.rangeRules || currentRule.rangeRules.length === 0)
        ) {
          setCurrentRule((prev) => ({
            ...prev,
            rangeRules: [{ minValue: "", maxValue: "", rewardValue: "" }],
          }));
        }
      } else {
        // If no combination is found (should not typically happen in edit mode),
        // preserve the current operator.
        if (currentRule.ruleId && currentRule.ruleOperator) {
          setValidOperators([currentRule.ruleOperator]);
          setValueType(typeof currentRule.ruleValue === "boolean" ? "BOOLEAN" : "NUMBER");
        }
      }
    } else {
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
      console.error("Kural silinirken hata oluştu:", err);
      setFormError(extractErrorMessage(err));
    }
  };

  const validateRule = () => {
    if (!currentRule.ruleKey) return "Lütfen bir Kural Anahtarı seçin.";
    if (!currentRule.ruleOperator) return "Lütfen bir Operatör seçin.";

    const operatorOnly = ["IS_TRUE", "IS_FALSE"].includes(currentRule.ruleOperator);

    if (valueType === "BOOLEAN" && !operatorOnly) {
      if (typeof currentRule.ruleValue !== "boolean") {
        return "Lütfen boolean değeri ayarlayın (işaretli = Doğru, işaretsiz = Yanlış).";
      }
    }

    if (valueType === "NUMBER" && !operatorOnly) {
      if (currentRule.ruleValue === "" || isNaN(currentRule.ruleValue)) {
        return "Lütfen kural değeri için geçerli bir sayı girin.";
      }
    }

    if (currentRule.ruleOrder === "" || isNaN(currentRule.ruleOrder)) {
      return "Lütfen Kural Sırası için geçerli bir sayı girin.";
    }

    if (valueType === "RANGE") {
      if (!currentRule.rangeRules || currentRule.rangeRules.length === 0) {
        return "Lütfen en az bir aralık kuralı ekleyin.";
      }
      for (let i = 0; i < currentRule.rangeRules.length; i++) {
        const rr = currentRule.rangeRules[i];
        if (rr.minValue === "" || isNaN(rr.minValue)) {
          return `Lütfen aralık kuralı ${i + 1} için geçerli bir minimum değer girin.`;
        }
        if (rr.maxValue === "" || isNaN(rr.maxValue)) {
          return `Lütfen aralık kuralı ${i + 1} için geçerli bir maksimum değer girin.`;
        }
        if (rr.rewardValue === "" || isNaN(rr.rewardValue)) {
          return `Lütfen aralık kuralı ${i + 1} için geçerli bir ödül değeri girin.`;
        }
      }
    }

    return "";
  };

  const handleSaveRule = async () => {
    if (!currentRule) return;

    // Validate the rule (assuming this function exists)
    const validationMsg = validateRule();
    if (validationMsg) {
      setFormError(validationMsg);
      return;
    }

    // Extract original values if available, otherwise use currentRule values
    const originalRule = currentRule.original || {};
    const payload = {
      ...currentRule,
      ruleKey: originalRule.ruleKey || currentRule.ruleKey,
      ruleOperator: originalRule.ruleOperator || currentRule.ruleOperator,
    };

    // Remove ruleValue for specific operators if needed
    if (["IS_TRUE", "IS_FALSE"].includes(payload.ruleOperator)) {
      delete payload.ruleValue;
    }

    // Exclude the 'original' property from the payload
    const { original, ...payloadToSend } = payload;

    const token = sessionStorage.getItem("token");
    const isEditing = !!currentRule.ruleId;

    try {
      const res = isEditing
        ? await axios.put(`${BONUSES_API}/${bonusId}/rules/${currentRule.ruleId}`, payloadToSend, {
            headers: { Authorization: token },
          })
        : await axios.post(`${BONUSES_API}/${bonusId}/rules`, payloadToSend, {
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
          <MDTypography variant="h6">Bonus verisi bulunamadı.</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const columns = [
    { Header: "Kural Anahtarı", accessor: "ruleKey" },
    { Header: "Operatör", accessor: "ruleOperator" },
    { Header: "Değer", accessor: "ruleValue" },
    { Header: "Sıra", accessor: "ruleOrder" },
    {
      Header: "İşlemler",
      accessor: "ruleId",
      Cell: (cellProps) => (
        <ActionsCell row={cellProps.row} onEdit={handleEditRule} onDelete={handleDeleteRule} />
      ),
    },
  ];

  const rows = rules.map((rule) => ({
    ruleKey: translateRuleKey(rule.ruleKey),
    ruleOperator: translateRuleOperator(rule.ruleOperator),
    ruleValue:
      rule.ruleValue !== undefined && rule.ruleValue !== null ? rule.ruleValue.toString() : "N/A",
    ruleOrder: rule.ruleOrder !== undefined && rule.ruleOrder !== null ? rule.ruleOrder : "0",
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
                  {bonus.name || "İsimsiz Bonus"}
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                <MDTypography variant="h6">Açıklama</MDTypography>
                <MDTypography variant="body2" mb={2}>
                  {bonus.description || "Açıklama mevcut değil."}
                </MDTypography>

                <MDTypography variant="h6" mb={1}>
                  Kurallar
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
                        rangeRules: [],
                      });
                      setSelectedRuleKey("");
                      setValidOperators([]);
                      setValueType("");
                      setDialogOpen(true);
                      setFormError("");
                    }}
                  >
                    Kural Ekle
                  </Button>
                  <Button variant="contained" color="secondary" onClick={goBack}>
                    Geri
                  </Button>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Kural Ekle/Düzenle Diyaloğu */}
      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentRule?.ruleId ? "Kuralı Düzenle" : "Kural Ekle"}</DialogTitle>
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
                <InputLabel id="rule-key-label">Kural Anahtarı</InputLabel>
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
                  label="Kural Anahtarı"
                  disabled={Boolean(currentRule?.ruleId)}
                >
                  {ruleCombinations.map((combination) => (
                    <MenuItem key={combination.ruleKey} value={combination.ruleKey}>
                      {translateRuleKey(combination.ruleKey)}
                    </MenuItem>
                  ))}
                  {currentRule &&
                    currentRule.ruleKey &&
                    !ruleCombinations.find((rc) => rc.ruleKey === currentRule.ruleKey) && (
                      <MenuItem key={currentRule.ruleKey} value={currentRule.ruleKey}>
                        {currentRule.ruleKey}
                      </MenuItem>
                    )}
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
                <InputLabel id="operator-label">Operatör</InputLabel>
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
                  label="Operatör"
                >
                  {validOperators.map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {translateRuleOperator(operator)}
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
                    label="Değer (İşaretli = Doğru, İşaretsiz = Yanlış)"
                  />
                </Grid>
              )}

            {valueType === "NUMBER" && (
              <Grid item xs={12}>
                <TextField
                  label="Değer"
                  type="number"
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  value={
                    currentRule?.ruleValue !== undefined && currentRule.ruleValue !== null
                      ? currentRule.ruleValue
                      : ""
                  }
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
                  <MDTypography variant="h6">Aralık Kuralları</MDTypography>
                </Grid>
                {currentRule?.rangeRules &&
                  currentRule.rangeRules.map((rangeRule, index) => (
                    <Grid container spacing={2} key={index} alignItems="center">
                      <Grid item xs={4}>
                        <TextField
                          label="Minimum Değer"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={
                            rangeRule.minValue !== undefined && rangeRule.minValue !== null
                              ? rangeRule.minValue
                              : ""
                          }
                          onChange={(e) =>
                            handleRangeRuleChange(index, "minValue", parseFloat(e.target.value))
                          }
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Maksimum Değer"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={
                            rangeRule.maxValue !== undefined && rangeRule.maxValue !== null
                              ? rangeRule.maxValue
                              : ""
                          }
                          onChange={(e) =>
                            handleRangeRuleChange(index, "maxValue", parseFloat(e.target.value))
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Ödül Değeri"
                          type="number"
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          value={
                            rangeRule.rewardValue !== undefined && rangeRule.rewardValue !== null
                              ? rangeRule.rewardValue
                              : ""
                          }
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
                    Aralık Kuralı Ekle
                  </Button>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Kural Sırası"
                type="number"
                fullWidth
                variant="outlined"
                margin="normal"
                value={
                  currentRule?.ruleOrder !== undefined && currentRule.ruleOrder !== null
                    ? currentRule.ruleOrder
                    : ""
                }
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
            İptal
          </Button>
          <Button onClick={handleSaveRule} color="primary" variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hata mesajları için Snackbar */}
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
