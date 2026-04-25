export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Uses `permissions` from login (JWT payload mirrored in localStorage).
 * Admin with an empty permission list gets the full set from the API on login — but older
 * tokens may omit newer keys like `tasks`; Admin/Manager/User still see Tasks in the UI here.
 */
export function canAccessModule(user, moduleKey) {
  if (!user || !moduleKey) return false;
  const perms = user.permissions;
  if (!Array.isArray(perms)) return false;
  if (perms.includes(moduleKey)) return true;
  if (moduleKey === "tasks") {
    const r = getUserRole(user).toLowerCase();
    if (r === "admin" || r === "manager" || r === "user" || r === "employee") {
      return true;
    }
  }
  return false;
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export function getUserRole(user = getStoredUser()) {
  if (!user) return "";
  return String(user.role || "").trim();
}

export function isAdminUser(user = getStoredUser()) {
  return getUserRole(user).toLowerCase() === "admin";
}

/** Manager sees extra dashboard “info” tooltips. */
export function isManagerUser(user = getStoredUser()) {
  return getUserRole(user).toLowerCase() === "manager";
}

/** Staff / field user (API role `User` — treated as employee in UI). */
export function isEmployeeLikeUser(user = getStoredUser()) {
  const r = getUserRole(user).toLowerCase();
  return r === "user" || r === "employee";
}
