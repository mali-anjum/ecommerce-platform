"use client";

import { UserManagementPanel } from "@/components/super-admin/users/organisms/UserManagementPanel";

export default function SuperAdminUsersPage() {
  return (
    <UserManagementPanel
      title="Users"
      description="Manage customers, sellers, and account access."
      helpText="Deactivate marks an account inactive in the database (you cannot deactivate yourself). Change role from Actions — e.g. promote a customer to Seller or Super Admin. Role is shown once in the Role column; use Actions only to change it."
    />
  );
}
