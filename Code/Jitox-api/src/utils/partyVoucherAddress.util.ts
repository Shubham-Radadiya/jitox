import {
  buildFullAddressMultiline,
  normalizeStructuredAddress,
  trimAddressPart,
  type StructuredAddress,
} from "./address.util";

function structuredBusinessFromAccount(
  raw: Record<string, unknown>
): StructuredAddress {
  return normalizeStructuredAddress({
    streetAddress: raw.businessStreetAddress,
    area: raw.businessArea,
    city: raw.businessCity,
    taluka: raw.businessTaluka,
    district: raw.businessDistrict,
    state: raw.businessState,
    country: raw.businessCountry,
    pincode: raw.businessPincode,
  });
}

function structuredResidentialFromAccount(
  raw: Record<string, unknown>
): StructuredAddress {
  const base = normalizeStructuredAddress({
    streetAddress: raw.streetAddress ?? raw.street,
    area: raw.area,
    city: raw.city,
    taluka: raw.taluka,
    district: raw.district,
    state: raw.state,
    country: raw.country,
    pincode: raw.pincode ?? raw.pinCode,
  });
  if (!trimAddressPart(base.streetAddress) && trimAddressPart(raw.address)) {
    return { ...base, streetAddress: trimAddressPart(raw.address) };
  }
  if (
    !trimAddressPart(base.streetAddress) &&
    trimAddressPart(raw.residentialAddress)
  ) {
    return {
      ...base,
      streetAddress: trimAddressPart(raw.residentialAddress),
    };
  }
  return base;
}

/** Multi-line address for voucher bill/ship blocks (business first, then residential). */
export function accountToVoucherPartyAddress(
  raw: Record<string, unknown>
): string {
  const business = buildFullAddressMultiline(
    structuredBusinessFromAccount(raw)
  );
  if (trimAddressPart(business)) return business;

  const residential = buildFullAddressMultiline(
    structuredResidentialFromAccount(raw)
  );
  if (trimAddressPart(residential)) return residential;

  return (
    trimAddressPart(raw.address) ||
    trimAddressPart(raw.residentialAddress) ||
    ""
  );
}

export function buildPartyAddressesMap(
  accounts: Array<Record<string, unknown>>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of accounts) {
    const name = String(a.businessName ?? a.name ?? "").trim();
    if (!name) continue;
    const addr = accountToVoucherPartyAddress(a);
    if (addr) map[name] = addr;
  }
  return map;
}
