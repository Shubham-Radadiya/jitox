import { Types } from "mongoose";
import Territory from "../models/territory.model";
import User from "../models/user.model";

/** Sample territories for address auto-assignment (Gujarat-focused). */
export async function ensureDefaultTerritories(): Promise<void> {
  const count = await Territory.countDocuments();
  if (count > 0) return;

  await Territory.insertMany([
    {
      name: "North Gujarat",
      code: "NGJ",
      states: ["Gujarat"],
      districts: ["Sabarkantha", "Aravalli", "Mahesana", "Mehsana"],
      cities: ["Modasa", "Himatnagar", "Vijapur"],
      pincodes: [],
    },
    {
      name: "Saurashtra",
      code: "SAU",
      states: ["Gujarat"],
      districts: ["Rajkot", "Jamnagar"],
      cities: ["Rajkot", "Gondal"],
      pincodes: [],
    },
    {
      name: "South Gujarat",
      code: "SGJ",
      states: ["Gujarat"],
      districts: ["Surat", "Bharuch"],
      cities: ["Surat", "Bharuch"],
      pincodes: [],
    },
  ]);
  console.log("[seed] Default territories created");

  const manager = await User.findOne({ email: "manager@gmail.com" });
  const north = await Territory.findOne({ name: "North Gujarat" });
  if (manager && north) {
    if (!north.managerId) {
      north.managerId = manager._id as Types.ObjectId;
      await north.save();
    }
    if (!manager.territoryId) {
      manager.territoryId = north._id as Types.ObjectId;
      manager.region = north.name;
      await manager.save();
    }
  }
}
