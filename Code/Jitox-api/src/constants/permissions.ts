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
  if (!list.length) {
    return [...DEFAULT_SELF_REGISTER_PERMISSIONS];
  }
  return list;
}

export const DEFAULT_SELF_REGISTER_PERMISSIONS: string[] = [
  "dashboard",
  "vouchers",
  "orders",
];
