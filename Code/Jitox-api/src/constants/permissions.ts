/** Module keys for sidebar / API access (admin assigns subsets to Manager & User). */
export const ALL_MODULE_PERMISSIONS = [
  "dashboard",
  "accounts",
  "products",
  "vouchers",
  "daybook",
  "orders",
  "employees",
  "hrm",
  "receivable",
  "payable",
  "stock",
  "users",
  "schemes",
  "documents",
  "target-incentive",
  "reports",
  "tasks",
  "territories",
] as const;

export type ModulePermission = (typeof ALL_MODULE_PERMISSIONS)[number];

const PERM_SET = new Set<string>(ALL_MODULE_PERMISSIONS);

export function sanitizePermissionList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (p): p is string => typeof p === "string" && PERM_SET.has(p)
  );
}

/** JWT + API responses: Admin with empty stored list = full access. */
export function effectivePermissions(
  role: string,
  stored: string[] | undefined | null
): string[] {
  const list = sanitizePermissionList(stored);
  if (role === "Admin") {
    if (!list.length) return [...ALL_MODULE_PERMISSIONS];
    return list;
  }
  if (role === "Manager" && !list.length) {
    return [...DEFAULT_MANAGER_PERMISSIONS];
  }
  if (role === "User" && !list.length) {
    return [];
  }
  if (!list.length) {
    return [...DEFAULT_SELF_REGISTER_PERMISSIONS];
  }
  return list;
}

/** Field users (mobile app) — no dashboard modules. */
export const DEFAULT_SELF_REGISTER_PERMISSIONS: string[] = [];

/** Applied when admin creates a Manager without selecting modules. */
export const DEFAULT_MANAGER_PERMISSIONS: string[] = [
  "dashboard",
  "orders",
  "employees",
  "tasks",
  "reports",
  "accounts",
  "products",
];

export function roleUsesDashboard(role: string): boolean {
  const r = String(role || "").trim();
  return r === "Admin" || r === "Manager";
}

export function roleUsesMobileApp(role: string): boolean {
  return String(role || "").trim() === "User";
}

export type AuthClient = "web" | "mobile";

/** Reject login when role does not match the client app. */
export function assertClientAllowedForRole(
  role: string,
  client: AuthClient
): void {
  if (client === "web" && !roleUsesDashboard(role)) {
    throw new Error(
      "This account is for the mobile field app only. Please use the Jitox mobile app."
    );
  }
  if (client === "mobile" && !roleUsesMobileApp(role)) {
    throw new Error(
      "Admin and Manager accounts must sign in on the web dashboard."
    );
  }
}

export function permissionsPayloadForClient(
  role: string,
  permissions: string[]
) {
  return {
    permissions,
    access: {
      dashboard: roleUsesDashboard(role),
      mobile: roleUsesMobileApp(role),
    },
  };
}
