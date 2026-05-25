import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  clearAuthSession,
  canAccessModule,
  getStoredUser,
  isPanelUser,
} from "../../utils/authSession";
import {
  getFirstAllowedDashboardPath,
  getModuleForPath,
} from "../../constants/routePermissions";

function getStoredToken() {
  return (
    localStorage.getItem("token") || localStorage.getItem("access_token") || ""
  );
}

/**
 * Protects all /dashboard routes: panel roles only, module permissions enforced.
 */
export default function DashboardGate() {
  const location = useLocation();
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user || !isPanelUser(user)) {
    clearAuthSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message:
            "Field user accounts must sign in on the Jitox mobile app.",
        }}
      />
    );
  }

  const moduleKey = getModuleForPath(location.pathname);
  if (!canAccessModule(user, moduleKey)) {
    const fallback = getFirstAllowedDashboardPath(user);
    if (location.pathname === fallback) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
