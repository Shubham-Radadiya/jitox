import { Role } from "../constants/roles";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authonticated.middleware";

export const adminAuthenticate = [isAuthenticated, authorizeRoles(Role.admin)];

export const dashboardAuthenticate = [
  isAuthenticated,
  authorizeRoles(Role.admin, Role.manager),
];

export const fieldUserAuthenticate = [
  isAuthenticated,
  authorizeRoles(Role.user),
];
// export const bothAuth = [
//   isAuthenticated,
//   authorizeRoles(role.superAdmin, role.user),
// ];
