// src/routes.js

import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import RTL from "layouts/rtl";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import PortalManagement from "layouts/portals/PortalManagement";
import BonusesManagement from "layouts/bonuses/BonusesManagement";
import BonusDetails from "layouts/bonuses/BonusDetails";
import BonusEdit from "layouts/bonuses/BonusEdit";
import Icon from "@mui/material/Icon";
import PortalLogs from "./layouts/portals/PortalLogs";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Tables",
    key: "tables",
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/tables",
    component: <Tables />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Billing",
    key: "billing",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/billing",
    component: <Billing />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "RTL",
    key: "rtl",
    icon: <Icon fontSize="small">format_textdirection_r_to_l</Icon>,
    route: "/rtl",
    component: <RTL />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Notifications",
    key: "notifications",
    icon: <Icon fontSize="small">notifications</Icon>,
    route: "/notifications",
    component: <Notifications />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Portals",
    key: "portals",
    icon: <Icon fontSize="small">web</Icon>,
    route: "/portals",
    component: <PortalManagement />,
    protected: true, // Add this line
  },
  {
    type: "route",
    name: "Portal Logs",
    key: "portal-logs",
    route: "/portals/:id/logs",
    component: <PortalLogs />,
    protected: true, // Add this line
  },
  {
    type: "collapse",
    name: "Bonuses",
    key: "bonuses",
    icon: <Icon fontSize="small">card_giftcard</Icon>,
    route: "/bonuses",
    component: <BonusesManagement />,
    protected: true, // Add this line
  },
  {
    type: "route",
    name: "Bonus Details",
    key: "bonus-details",
    route: "/bonuses/:bonusId/details",
    component: <BonusDetails />,
    protected: true, // Add this line
  },
  {
    type: "route",
    name: "Bonus Edit",
    key: "bonus-edit",
    route: "/bonuses/:bonusId/edit",
    component: <BonusEdit />,
    protected: true, // Add this line
  },
  // Public routes (no need for 'protected' property or set it to false)
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
    protected: false, // Explicitly mark as public
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/authentication/sign-up",
    component: <SignUp />,
    protected: false, // Explicitly mark as public
  },
];

export default routes;
