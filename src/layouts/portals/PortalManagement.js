import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DataTable from "../../examples/Tables/DataTable";
import MDButton from "../../components/MDButton";
import MDBox from "../../components/MDBox";
import MDTypography from "../../components/MDTypography";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PortalFormModal from "./PortalFormModal"; // Import the modal for adding a new portal

function ActionMenu({ portalId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRequestLog = () => {
    console.log(`Request log for portal ${portalId}`);
    navigate(`/portals/${portalId}/logs`);
    handleClose();
  };

  return (
    <div style={{ position: "relative" }}>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleRequestLog}>Request Log</MenuItem>
      </Menu>
    </div>
  );
}

ActionMenu.propTypes = {
  portalId: PropTypes.number.isRequired,
};

function ActionsCell({ row }) {
  return <ActionMenu portalId={row.original.id} />;
}

ActionsCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

function PortalManagement() {
  const [portals, setPortals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/portal", {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });
      setPortals(response.data);
    } catch (error) {
      console.error("Error fetching portals:", error);
    }
  };

  const handleAddPortal = async (newPortal) => {
    try {
      const response = await axios.post("http://localhost:8080/api/portal", newPortal, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });
      setPortals((prevPortals) => [...prevPortals, response.data]);
      setShowModal(false); // Close modal after successful submission
    } catch (error) {
      console.error("Error adding portal:", error);
    }
  };

  const columns = [
    { Header: "Domain Name", accessor: "domainName" },
    { Header: "Portal Type", accessor: "portalType" },
    { Header: "API Username", accessor: "apiUsername" },
    { Header: "API Token", accessor: "apiToken" },
    {
      Header: "Actions",
      accessor: "id",
      Cell: ActionsCell,
    },
  ];

  const rows = portals.map((portal) => ({
    domainName: portal.domainName,
    portalType: portal.portalType,
    apiUsername: portal.apiUsername,
    apiToken: portal.apiToken,
    id: portal.id,
  }));

  return (
    <MDBox>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDTypography variant="h4">Portals</MDTypography>
        <MDButton color="info" onClick={() => setShowModal(true)}>
          Add New Portal
        </MDButton>
      </MDBox>
      <DataTable
        table={{ columns, rows }}
        entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
        canSearch
        showTotalEntries
        isSorted
        pagination
      />
      {showModal && (
        <PortalFormModal
          onClose={() => setShowModal(false)}
          onSave={handleAddPortal} // Pass the function to save the new portal
        />
      )}
    </MDBox>
  );
}

export default PortalManagement;
