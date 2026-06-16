"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminUsersStore } from "@/components/super-admin/users/state/useAdminUsersStore";
import { useAuthStore } from "@/components/auth/state/useAuthStore";
import type { AdminUserRole } from "@/components/super-admin/users/types/userAdminTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { ROLE_LABELS, roleBadgeClass } from "../utils/userAdminLabels";
import { UserRowActions } from "../molecules/UserRowActions";

export interface UserManagementPanelProps {
  title: string;
  description: string;
  /** When set, list is always filtered to this role (e.g. Admins page). */
  fixedRole?: AdminUserRole;
  helpText?: string;
}

export function UserManagementPanel({
  title,
  description,
  fixedRole,
  helpText,
}: UserManagementPanelProps) {
  const { items, meta, isLoading, error, fetchUsers, setUserStatus, setUserRole } =
    useAdminUsersStore();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | AdminUserRole>(fixedRole ?? "all");
  const [active, setActive] = useState<"all" | "true" | "false">("all");

  const effectiveRole = fixedRole ?? (role === "all" ? undefined : role);

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(effectiveRole ? { role: effectiveRole } : {}),
      ...(active !== "all" ? { active } : {}),
    }),
    [page, q, effectiveRole, active]
  );

  useEffect(() => {
    void fetchUsers(query);
  }, [fetchUsers, query]);

  const totalActive = items.filter((u) => u.isActive).length;
  const totalSellers = items.filter((u) => u.role === "SELLER").length;
  const totalAdmins = items.filter((u) => u.role === "SUPER_ADMIN").length;

  const summaryCards = fixedRole === "SUPER_ADMIN"
    ? [
        { label: "Admins on page", value: items.length },
        { label: "Active", value: totalActive, className: "text-success" },
        { label: "Inactive", value: items.length - totalActive },
      ]
    : [
        { label: "On this page", value: items.length },
        { label: "Active", value: totalActive, className: "text-success" },
        { label: "Sellers", value: totalSellers },
        { label: "Super Admins", value: totalAdmins },
      ];

  return (
    <main className="min-h-screen bg-linear-to-b from-background to-card/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          {helpText ? (
            <p className="max-w-3xl rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {helpText}
            </p>
          ) : null}
        </header>

        <section
          className={`grid gap-4 sm:grid-cols-2 ${summaryCards.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.className ?? ""}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{fixedRole === "SUPER_ADMIN" ? "Admin accounts" : "User accounts"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`grid grid-cols-1 gap-3 ${fixedRole ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
            >
              <div className={`relative ${fixedRole ? "lg:col-span-2" : "lg:col-span-2"}`}>
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Search by name or email..."
                  className="pl-9"
                />
              </div>
              {!fixedRole ? (
                <Select
                  value={role}
                  onValueChange={(value: "all" | AdminUserRole) => {
                    setPage(1);
                    setRole(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="USER">{ROLE_LABELS.USER}</SelectItem>
                    <SelectItem value="SELLER">{ROLE_LABELS.SELLER}</SelectItem>
                    <SelectItem value="SUPER_ADMIN">{ROLE_LABELS.SUPER_ADMIN}</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              <Select
                value={active}
                onValueChange={(value: "all" | "true" | "false") => {
                  setPage(1);
                  setActive(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{user.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleBadgeClass[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isActive
                                ? "bg-success/20 text-success border-success/20"
                                : "bg-destructive/20 text-destructive border-destructive/20"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count.orders}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <UserRowActions
                            user={user}
                            currentUserId={currentUserId}
                            onStatusChange={setUserStatus}
                            onRoleChange={setUserRole}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {Math.max(1, meta.totalPages)} ({meta.total} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading || page >= Math.max(1, meta.totalPages)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
