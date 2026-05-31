"use client";

import type { AdminUserListItem, AdminUserRole } from "@/types/admin/userAdminTypes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ROLE_LABELS } from "../utils/userAdminLabels";

const ALL_ROLES: AdminUserRole[] = ["USER", "SELLER", "SUPER_ADMIN"];

interface UserRowActionsProps {
  user: AdminUserListItem;
  currentUserId: string | null;
  onStatusChange: (userId: string, isActive: boolean) => Promise<boolean>;
  onRoleChange: (userId: string, role: AdminUserRole) => Promise<boolean>;
}

export function UserRowActions({
  user,
  currentUserId,
  onStatusChange,
  onRoleChange,
}: UserRowActionsProps) {
  const isSelf = currentUserId === user.id;

  const handleStatusToggle = async () => {
    const nextActive = !user.isActive;
    const action = nextActive ? "reactivate" : "deactivate";
    const confirmed = window.confirm(
      nextActive
        ? `Reactivate ${user.email}? They will be marked active in the system.`
        : `Deactivate ${user.email}? Their account will be marked inactive. You cannot deactivate your own account.`
    );
    if (!confirmed) return;
    await onStatusChange(user.id, nextActive);
  };

  const handleRoleChange = async (role: AdminUserRole) => {
    if (role === user.role) return;
    const confirmed = window.confirm(
      `Change ${user.email} from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[role]}?`
    );
    if (!confirmed) return;
    await onRoleChange(user.id, role);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions for {user.email}</span>
          <span className="hidden sm:inline">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[100] w-56 border-border bg-card text-foreground shadow-xl"
      >
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSelf && user.isActive}
          onClick={() => void handleStatusToggle()}
        >
          {user.isActive ? "Deactivate account" : "Reactivate account"}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isSelf && user.role === "SUPER_ADMIN"}>
            Change role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="z-[100] border-border bg-card shadow-xl">
            {ALL_ROLES.map((role) => (
              <DropdownMenuItem
                key={role}
                disabled={role === user.role || (isSelf && role !== "SUPER_ADMIN")}
                onClick={() => void handleRoleChange(role)}
              >
                {ROLE_LABELS[role]}
                {role === user.role ? " (current)" : ""}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
