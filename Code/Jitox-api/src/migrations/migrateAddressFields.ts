/**
 * One-time migration: preserve legacy single-line addresses and seed structured street.
 *
 * Run: npm run migrate:address
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";
import Account from "../models/account.model";
import { trimAddressPart } from "../utils/address.util";

dotenv.config();

async function migrateUsers(): Promise<number> {
  const all = await User.find({});
  let n = 0;
  for (const u of all) {
    const legacy = trimAddressPart(u.address);
    let changed = false;
    if (legacy && !trimAddressPart(u.fullAddressBackup)) {
      u.fullAddressBackup = legacy;
      changed = true;
    }
    if (legacy && !trimAddressPart(u.streetAddress)) {
      u.streetAddress = legacy;
      changed = true;
    }
    if (changed) {
      await u.save();
      n += 1;
    }
  }
  return n;
}

async function migrateAccounts(): Promise<number> {
  const all = await Account.find({});
  let n = 0;
  for (const a of all) {
    const legacy = trimAddressPart(a.residentialAddress);
    let changed = false;
    if (legacy && !trimAddressPart(a.residentialFullAddressBackup)) {
      a.residentialFullAddressBackup = legacy;
      changed = true;
    }
    if (legacy && !trimAddressPart(a.streetAddress)) {
      a.streetAddress = legacy;
      changed = true;
    }
    if (changed) {
      await a.save();
      n += 1;
    }
  }
  return n;
}

async function main(): Promise<void> {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGO_URI or MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("[migrate] Connected");

  const u = await migrateUsers();
  const a = await migrateAccounts();
  console.log(`[migrate] Users updated: ${u}, Accounts updated: ${a}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
