"use client";
``
import { UserManagementPanel } from "@/components/super-admin/users/organisms/UserManagementPanel";

export default function SuperAdminAdminsPage() {
  return (
    <UserManagementPanel
      title="Admins"
      description="Super Admin accounts with full platform access."
      fixedRole="SUPER_ADMIN"
      helpText="Only users with the Super Admin role appear here. Use Actions to deactivate an admin or change their role (you cannot demote your own Super Admin role)."
    />
  );
}
