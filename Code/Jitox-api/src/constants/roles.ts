export const Role = {
  admin: "Admin",
  manager: "Manager",
  user: "User",
} as const;

export type AppRole = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: AppRole[] = [Role.admin, Role.manager, Role.user];

export function parseRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const lower = value.trim().toLowerCase();
  if (lower === "admin") return Role.admin;
  if (lower === "manager") return Role.manager;
  if (lower === "user") return Role.user;
  return null;
}
