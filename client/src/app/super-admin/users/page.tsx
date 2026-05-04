"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminUsersStore } from "@/store/useAdminUsersStore";
import type { AdminUserRole } from "@/types/admin/userAdminTypes";
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

const roleBadgeClass: Record<AdminUserRole, string> = {
  USER: "bg-muted text-muted-foreground border-border",
  SELLER: "bg-primary/20 text-primary border-primary/20",
  SUPER_ADMIN: "bg-secondary/20 text-secondary border-secondary/20",
};

export default function SuperAdminUsersPage() {
  const { items, meta, isLoading, error, fetchUsers, setUserStatus, setUserRole } =
    useAdminUsersStore();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | AdminUserRole>("all");
  const [active, setActive] = useState<"all" | "true" | "false">("all");

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(role !== "all" ? { role } : {}),
      ...(active !== "all" ? { active } : {}),
    }),
    [page, q, role, active]
  );

  useEffect(() => {
    void fetchUsers(query);
  }, [fetchUsers, query]);

  const totalActive = items.filter((u) => u.isActive).length;
  const totalSellers = items.filter((u) => u.role === "SELLER").length;
  const totalAdmins = items.filter((u) => u.role === "SUPER_ADMIN").length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage users, seller access, and account states.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loaded Users</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-success">{totalActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sellers</p>
              <p className="text-2xl font-bold">{totalSellers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Super Admins</p>
              <p className="text-2xl font-bold">{totalAdmins}</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
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
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
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
                          <Badge className={roleBadgeClass[user.role]}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isActive
                                ? "bg-success/20 text-success border-success/20"
                                : "bg-destructive/20 text-destructive border-destructive/20"
                            }
                          >
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count.orders}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void setUserStatus(user.id, !user.isActive)}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Select
                              value={user.role}
                              onValueChange={(value: AdminUserRole) => void setUserRole(user.id, value)}
                            >
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="SELLER">SELLER</SelectItem>
                                <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
