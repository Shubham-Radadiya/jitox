import bcrypt from "bcrypt";
import { ALL_MODULE_PERMISSIONS } from "./permissions";

export const defaultUsers = async () => {
  const adminPassword = await bcrypt.hash("123456", 10);
  const testUserPassword = await bcrypt.hash("123456", 10);
  const managerPassword = await bcrypt.hash("123456", 10);

  const managerPermissions = ALL_MODULE_PERMISSIONS.filter(
    (p) => p !== "users"
  );

  return {
    admin: {
      name: "Admin User",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "Admin" as const,
      permissions: [] as string[],
      firstName: "Admin",
      lastName: "User",
      fullAddressBackup: "123 Admin St",
      streetAddress: "123 Admin St",
      area: "Sector 1",
      city: "Admin City",
      state: "Gujarat",
      taluka: "Admin Taluka",
      district: "Admin District",
      country: "India",
      pincode: "382015",
    },
    manager: {
      name: "Manager User",
      email: "manager@gmail.com",
      password: managerPassword,
      role: "Manager" as const,
      permissions: [...managerPermissions],
      firstName: "Manager",
      lastName: "User",
      fullAddressBackup: "789 Manager Rd",
      streetAddress: "789 Manager Rd",
      area: "Block A",
      city: "Surat",
      state: "Gujarat",
      taluka: "Manager Taluka",
      district: "Manager District",
      country: "India",
      pincode: "395007",
    },
    user: {
      name: "Test User",
      email: "testuser@gmail.com",
      password: testUserPassword,
      role: "User" as const,
      permissions: ["dashboard", "accounts", "tasks"],
      firstName: "Test",
      lastName: "User",
      fullAddressBackup: "456 User Ave",
      streetAddress: "456 User Ave",
      area: "Vesu",
      city: "Surat",
      state: "Gujarat",
      taluka: "User Taluka",
      district: "User District",
      country: "India",
      pincode: "395007",
    },
  };
};
