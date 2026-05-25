/** Mobile self-registration lifecycle (admin approval required to log in). */
export const AccountStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type AccountStatusValue =
  (typeof AccountStatus)[keyof typeof AccountStatus];

export const ACCOUNT_STATUS_VALUES = Object.values(AccountStatus);

export function effectiveAccountStatus(
  raw: string | undefined | null
): AccountStatusValue {
  const s = String(raw || "").trim().toLowerCase();
  if (ACCOUNT_STATUS_VALUES.includes(s as AccountStatusValue)) {
    return s as AccountStatusValue;
  }
  return AccountStatus.APPROVED;
}
