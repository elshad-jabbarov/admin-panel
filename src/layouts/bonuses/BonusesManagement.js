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
const BONUSES_API = `${process.env.REACT_APP_API_URL}/api/bonuses`;
const PORTALS_API = `${process.env.REACT_APP_API_URL}/api/portal`;

/**
 * Bonus satırları için aksiyon menüsü:
 * - Detayları Gör
 * - Düzenle
 * - Sil
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
        <MenuItem onClick={handleViewDetails}>Detayları Gör</MenuItem>
        <MenuItem onClick={handleEdit}>Düzenle</MenuItem>
        <MenuItem onClick={handleDelete}>Sil</MenuItem>
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
 * Bonus Icon Cell Component
 */
const BonusIconCell = ({ value }) =>
  value ? (
    <img
      src={`data:image/png;base64,${value}`}
      alt="Bonus İkon Önizlemesi"
      style={{ width: "40px", height: "40px" }}
    />
  ) : (
    "İkon Yok"
  );

BonusIconCell.propTypes = {
  value: PropTypes.string,
};

/**
 * Bonus Yönetim Sayfası
 * "Bonus" CRUD işlemlerini ve isteğe bağlı partner bonus bağlantısını yönetir.
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
   * EFFECTS - TÜM VERİLERİ YÜKLE
   **********************************************************/
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("Yetkilendirme token'ı sessionStorage'da bulunamadı.");
      setLoading(false);
      return;
    }

    Promise.all([fetchBonuses(token), fetchExternalBonuses(token), fetchPortals(token)])
      .catch((err) => {
        console.error("Başlangıç verileri yüklenirken hata oluştu:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Mevcut (içsel) bonus listesini getir.
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
   * İsteğe bağlı partner bonus referansı için dış bonusları getir.
   */
  const fetchExternalBonuses = async (token) => {
    try {
      const response = await axios.get(`${BONUSES_API}/external`, {
        headers: { Authorization: token },
      });
      setExternalBonuses(response.data);
    } catch (err) {
      console.error("Dış bonuslar getirilirken hata oluştu:", err);
      // Dış bonuslar eksikse sayfayı engelleme.
      setError(extractErrorMessage(err));
    }
  };

  /**
   * Portal listesini getir (Portal açılır menüsü için).
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
   * CRUD İŞLEMLERİ
   **********************************************************/
  // "Bonus Ekle" boş form ile başlatır.
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

  // Mevcut bonusu düzenle.
  const handleEditBonus = (bonus) => {
    setCurrentBonus(bonus);
    setValidationAttempted(false);

    // Bonus türüne göre dış bonusları filtrele.
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

  // Mevcut bonusu sil.
  const handleDeleteBonus = async (bonusId) => {
    try {
      await axios.delete(`${BONUSES_API}/${bonusId}`, {
        headers: { Authorization: sessionStorage.getItem("token") },
      });
      setBonuses((prev) => prev.filter((b) => b.bonusId !== bonusId));
    } catch (err) {
      console.error("Bonus silinirken hata oluştu:", err);
      setError(extractErrorMessage(err));
    }
  };

  // Kaydetmeden önce alanları doğrula.
  const isFieldEmpty = (fieldValue) =>
    fieldValue === undefined || fieldValue === null || fieldValue.toString().trim() === "";

  const handleSaveBonus = async () => {
    setValidationAttempted(true);

    if (!currentBonus) return;

    const { name, description, portalId, maxAmount, percentage, bonusType, partnerBonusId } =
      currentBonus;

    // 1. Gerekli alanları kontrol et.
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
    // 2. Dış bonuslar varsa, partnerBonusId'nin doldurulması gereklidir.
    if (filteredExternalBonuses.length > 0 && isFieldEmpty(partnerBonusId)) {
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      if (currentBonus.bonusId) {
        // Mevcut bonusu güncelle.
        const res = await axios.put(`${BONUSES_API}/${currentBonus.bonusId}`, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) => prev.map((b) => (b.bonusId === currentBonus.bonusId ? res.data : b)));
      } else {
        // Yeni bonus oluştur.
        const res = await axios.post(BONUSES_API, currentBonus, {
          headers: { Authorization: token },
        });
        setBonuses((prev) => [...prev, res.data]);
      }

      setDialogOpen(false);
      setCurrentBonus(null);
      setValidationAttempted(false);
    } catch (err) {
      console.error("Bonus kaydedilirken hata oluştu:", err);
      setError(extractErrorMessage(err));
    }
  };

  /**********************************************************
   * TABLO TANIMLAMALARI
   **********************************************************/
  const bonusColumns = [
    { Header: "Bonus Kimliği", accessor: "bonusId" },
    { Header: "İsim", accessor: "name" },
    { Header: "Açıklama", accessor: "description" },
    { Header: "Portal Kimliği", accessor: "portalId" },
    {
      Header: "Maksimum Miktar",
      accessor: "maxAmount",
      Cell: ({ value }) => (value ? `$${value.toLocaleString()}` : "$0"),
    },
    {
      Header: "Yüzde",
      accessor: "percentage",
      Cell: ({ value }) => (value ? `${value}%` : "0%"),
    },
    { Header: "Bonus Türü", accessor: "bonusType" },
    {
      Header: "İkon",
      accessor: "iconImageBase64",
      Cell: BonusIconCell,
    },
    {
      Header: "İşlemler",
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

  // Bonus verilerini DataTable satırlarına dönüştür.
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
          {/* İçsel Bonuslar Tablosu */}
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
                  Bonuslar
                </MDTypography>
                <Button variant="contained" color="primary" onClick={handleAddBonus}>
                  Bonus Ekle
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

      {/* BONUS OLUŞTUR / DÜZENLE DİYALOĞU */}
      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{currentBonus?.bonusId ? "Bonus Düzenle" : "Bonus Ekle"}</DialogTitle>
        <DialogContent>
          {/* İSİM */}
          <TextField
            label="İsim"
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
                ? "İsim gereklidir."
                : ""
            }
          />

          {/* AÇIKLAMA */}
          <TextField
            label="Açıklama"
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
                ? "Açıklama gereklidir."
                : ""
            }
          />

          {/* PORTAL SEÇİMİ */}
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
                Portal gereklidir.
              </MDTypography>
            )}
          </FormControl>

          {/* MAKSİMUM MİKTAR */}
          <TextField
            label="Maksimum Miktar"
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
                ? "Maksimum Miktar gereklidir ve pozitif olmalıdır."
                : "Maksimum miktar için pozitif bir sayı girin."
            }
          />

          {/* YÜZDE */}
          <TextField
            label="Yüzde"
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
                ? "Yüzde gereklidir ve 0 ile 100 arasında olmalıdır."
                : "0 ile 100 arasında bir değer girin."
            }
          />

          {/* BONUS TÜRÜ */}
          <FormControl
            fullWidth
            variant="outlined"
            margin="normal"
            error={validationAttempted && isFieldEmpty(currentBonus?.bonusType)}
          >
            <InputLabel id="bonus-type-label">Bonus Türü</InputLabel>
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
              label="Bonus Türü"
            >
              <MenuItem value="2">WAGERING_BONUS</MenuItem>
              <MenuItem value="5">FREE_BET</MenuItem>
              <MenuItem value="6">FREE_SPIN</MenuItem>
            </Select>
            {validationAttempted && isFieldEmpty(currentBonus?.bonusType) && (
              <MDTypography variant="caption" color="error">
                Bonus Türü gereklidir.
              </MDTypography>
            )}
          </FormControl>

          {/* KOŞULLU ANA BONUS SEÇİMİ */}
          {filteredExternalBonuses.length > 0 && (
            <FormControl
              fullWidth
              variant="outlined"
              margin="normal"
              error={validationAttempted && isFieldEmpty(currentBonus?.partnerBonusId)}
            >
              <InputLabel id="parent-bonus-label">Ana Bonus</InputLabel>
              <Select
                labelId="parent-bonus-label"
                value={currentBonus?.partnerBonusId || ""}
                onChange={(e) =>
                  setCurrentBonus({ ...currentBonus, partnerBonusId: e.target.value })
                }
                label="Ana Bonus"
              >
                {filteredExternalBonuses.map((eb) => (
                  <MenuItem key={eb.id} value={eb.id}>
                    {eb.name}
                  </MenuItem>
                ))}
              </Select>
              {validationAttempted && isFieldEmpty(currentBonus?.partnerBonusId) && (
                <MDTypography variant="caption" color="error">
                  Ana Bonus gereklidir.
                </MDTypography>
              )}
            </FormControl>
          )}

          {/* RESİM YÜKLEME */}
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

          {/* Yüklenen resmin önizlemesi */}
          {currentBonus?.iconImageBase64 && (
            <img
              src={`data:image/png;base64,${currentBonus.iconImageBase64}`}
              alt="Bonus İkon Önizlemesi"
              style={{ width: "80px", height: "80px", marginTop: "1rem" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            İptal
          </Button>
          <Button onClick={handleSaveBonus} color="primary" variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hata bildirimleri için Snackbar */}
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
