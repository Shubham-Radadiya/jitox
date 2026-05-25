export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Admin and Manager use the web dashboard; User uses the mobile app only. */
export function isPanelUser(user = getStoredUser()) {
  const r = getUserRole(user).toLowerCase();
  return r === "admin" || r === "manager";
}

export function isFieldUser(user = getStoredUser()) {
  return getUserRole(user).toLowerCase() === "user";
}

/**
 * Module access from login permissions. Admin with empty list = full access (API fills on login).
 */
export function canAccessModule(user, moduleKey) {
  if (!user || !moduleKey) return false;
  if (isAdminUser(user)) return true;
  const perms = user.permissions;
  if (!Array.isArray(perms)) return false;
  return perms.includes(moduleKey);
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
