// src/routes.js
import Billing from "layouts/billing";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import PortalManagement from "layouts/portals/PortalManagement";
import BonusesManagement from "layouts/bonuses/BonusesManagement";
import BonusDetails from "layouts/bonuses/BonusDetails";
import PortalLogs from "layouts/portals/PortalLogs";
import AllLogs from "layouts/portals/AllLogs";
import Icon from "@mui/material/Icon";
import Logout from "./layouts/authentication/logout/Logout";

const routes = [
  {
    type: "collapse",
    name: "Portals",
    key: "portals",
    icon: <Icon fontSize="small">web</Icon>,
    route: "/portals",
    component: <PortalManagement />,
    protected: true,
  },
  {
    type: "route",
    name: "Portal Logs",
    key: "portal-logs",
    route: "/portals/:id/logs",
    component: <PortalLogs />,
    protected: true,
  },
  {
    type: "collapse",
    name: "All Logs",
    key: "all-logs",
    icon: <Icon fontSize="small">list</Icon>,
    route: "/portals/logs",
    component: <AllLogs />,
    protected: true,
  },
  {
    type: "collapse",
    name: "Bonuses",
    key: "bonuses",
    icon: <Icon fontSize="small">card_giftcard</Icon>,
    route: "/bonuses",
    component: <BonusesManagement />,
    protected: true,
  },
  {
    type: "route",
    name: "Bonus Details",
    key: "bonus-details",
    route: "/bonuses/:bonusId/details",
    component: <BonusDetails />,
    protected: true,
  },
  // Add a Logout route to clear authentication
  {
    type: "collapse",
    name: "Logout",
    key: "logout",
    icon: <Icon fontSize="small">logout</Icon>,
    route: "/logout",
    component: <Logout />,
    protected: true,
  },
  // Public routes (no need for 'protected' property or set it to false)
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
    protected: false,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/authentication/sign-up",
    component: <SignUp />,
    protected: false,
  },
];

export default routes;
