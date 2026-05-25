import mongoose from "mongoose";
import { User, Employee } from "../models";
import { defaultUsers } from "../constants/defaultUsers";

function toObjectId(id: unknown): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(String(id));
}

const TASKS_KEY = "tasks";

/** Add `tasks` to stored permission lists that predate the Tasks module. */
async function ensureTasksModuleOnUsers(): Promise<void> {
  const withList = await User.find({
    permissions: { $exists: true, $type: "array", $ne: [] },
  });
  for (const u of withList) {
    const list = u.permissions || [];
    if (!list.includes(TASKS_KEY)) {
      u.permissions = [...list, TASKS_KEY];
      await u.save();
      console.log(`[seed] Added "${TASKS_KEY}" to permissions for ${u.email}`);
    }
  }
}

/** Ensures seeded admin, manager, and test user exist (same as GET /users/get-users). */
export async function ensureDefaultUsers(): Promise<void> {
  const users = await defaultUsers();

  let admin = await User.findOne({ email: users.admin.email });
  if (!admin) {
    admin = new User(users.admin);
    await admin.save();
    console.log(`[seed] Created default admin: ${users.admin.email}`);
  }

  let manager = await User.findOne({ email: users.manager.email });
  if (!manager) {
    manager = new User(users.manager);
    await manager.save();
    console.log(`[seed] Created default manager: ${users.manager.email}`);
  }

  let testUser = await User.findOne({ email: users.user.email });
  if (!testUser) {
    testUser = new User(users.user);
    await testUser.save();
    console.log(`[seed] Created default user: ${users.user.email}`);
  }

  if (admin && manager && !manager.parentUserId) {
    manager.parentUserId = toObjectId(admin._id);
    if (!manager.createdBy) manager.createdBy = toObjectId(admin._id);
    await manager.save();
  }
  if (manager && testUser && !testUser.parentUserId) {
    testUser.parentUserId = toObjectId(manager._id);
    if (!testUser.createdBy) {
      testUser.createdBy = toObjectId(admin?._id ?? manager._id);
    }
    await testUser.save();
  }

  const fieldUsers = await User.find({ role: "User" }).select("name email phone").lean();
  for (const u of fieldUsers) {
    const email = String(u.email || "").trim().toLowerCase();
    if (!email) continue;

    let emp = await Employee.findOne({ email });
    if (!emp) {
      emp = await Employee.create({
        name: u.name || email,
        email,
        phone: u.phone || "",
        roleDesignation: "Field Executive",
        department: "Sales Department",
        joiningDate: new Date(),
        salaryStructure: { basic: 25000, allowances: [], deductions: [] },
        status: "Active",
        linkedUserId: toObjectId(u._id),
      });
      console.log(`[seed] Created HRM employee for field user ${email}`);
    } else if (!emp.linkedUserId) {
      emp.linkedUserId = toObjectId(u._id);
      await emp.save();
      console.log(`[seed] Linked employee ${email} to user ${email}`);
    }
  }

  if (testUser?.role === "User" && (testUser.permissions?.length ?? 0) > 0) {
    testUser.permissions = [];
    await testUser.save();
    console.log(`[seed] Cleared dashboard permissions for field user ${testUser.email}`);
  }

  await ensureTasksModuleOnUsers();
}
