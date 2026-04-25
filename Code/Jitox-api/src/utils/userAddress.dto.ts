import type { IUser } from "../types/user.type";
import {
  buildAddressTableSummary,
  buildFullAddressComma,
  buildFullAddressMultiline,
  normalizeStructuredAddress,
  StructuredAddress,
  trimAddressPart,
} from "./address.util";

export function structuredFromUserDoc(u: {
  streetAddress?: string;
  area?: string;
  city?: string;
  taluka?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  address?: string;
}): StructuredAddress {
  const base = normalizeStructuredAddress({
    streetAddress: u.streetAddress,
    area: u.area,
    city: u.city,
    taluka: u.taluka,
    district: u.district,
    state: u.state,
    country: u.country,
    pincode: u.pincode,
  });
  if (!trimAddressPart(base.streetAddress) && trimAddressPart(u.address)) {
    return { ...base, streetAddress: trimAddressPart(u.address) };
  }
  return base;
}

/** JSON-safe user object + computed address strings */
export function toPublicUser(u: IUser): Record<string, unknown> {
  const o = u.toObject() as Record<string, unknown>;
  delete o.password;
  const a = structuredFromUserDoc(u);
  return {
    ...o,
    fullAddress: buildFullAddressMultiline(a),
    fullAddressComma: buildFullAddressComma(a),
    addressSummary: buildAddressTableSummary(a),
  };
}
