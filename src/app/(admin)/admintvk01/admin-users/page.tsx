"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Loading from "@/components/ui/loading";
import { Shield, UserCog, Trash2, RefreshCw, UserPlus } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "isAdmin", label: "isAdmin (Site Control)" },
  { value: "content_admin", label: "Content Admin" },
  { value: "exam_admin", label: "Exam Admin" },
  { value: "qa_admin", label: "QA Admin" },
] as const;

type RoleOption = (typeof ROLE_OPTIONS)[number]["value"];

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  adminRole?: "super_admin" | "isAdmin" | "content_admin" | "exam_admin" | "qa_admin";
  isAdmin?: boolean;
};

type PreviewUser = {
  uid: string;
  email: string;
  displayName?: string;
  hasFirestoreProfile: boolean;
  currentAdminRole?: string | null;
  isAdmin?: boolean;
  role?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [editingRoleByUser, setEditingRoleByUser] = useState<Record<string, RoleOption>>({});
  const [selectedToRemove, setSelectedToRemove] = useState<AdminUser | null>(null);
  const [selectedToDelete, setSelectedToDelete] = useState<AdminUser | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<RoleOption>("content_admin");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);

  const normalizedInputEmail = newAdminEmail.trim().toLowerCase();
  const canCreateAdmin =
    !!previewUser &&
    previewUser.email.trim().toLowerCase() === normalizedInputEmail;

  const isSelf = (userId: string) => user?.uid === userId;

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/admin-users");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to load admin users");

      const data = await res.json();
      const fetchedUsers = (data.users || []) as AdminUser[];
      setUsers(fetchedUsers);
      setSummary(data.summary || {});

      const roleMap: Record<string, RoleOption> = {};
      fetchedUsers.forEach((u) => {
        if (u.adminRole) roleMap[u.id] = u.adminRole;
        else if (u.isAdmin) roleMap[u.id] = "isAdmin";
      });
      setEditingRoleByUser(roleMap);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch admin users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    loadAdmins();
  }, [authLoading, user]);

  const counts = useMemo(() => [
    { label: "Super Admin", value: summary.super_admin || 0 },
    { label: "isAdmin", value: summary.isAdmin || 0 },
    { label: "Content Admin", value: summary.content_admin || 0 },
    { label: "Exam Admin", value: summary.exam_admin || 0 },
    { label: "QA Admin", value: summary.qa_admin || 0 },
    { label: "Legacy isAdmin Only", value: summary.isAdminOnly || 0 },
  ], [summary]);

  const handleRoleSave = async (target: AdminUser) => {
    const selected = editingRoleByUser[target.id];
    if (!selected) return;

    try {
      const body =
        selected === "isAdmin"
          ? { userId: target.id, adminRole: "isAdmin", isAdmin: true }
          : { userId: target.id, adminRole: selected, isAdmin: selected === "super_admin" };

      const res = await authenticatedFetch("/api/admintvk01/admin-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update role");

      toast({ title: "Updated", description: "Admin role updated successfully" });
      loadAdmins();
    } catch (error) {
      toast({ title: "Error", description: "Role update failed", variant: "destructive" });
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedToRemove) return;
    try {
      const res = await authenticatedFetch(
        `/api/admintvk01/admin-users?userId=${selectedToRemove.id}&mode=remove_admin`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove admin");
      toast({ title: "Removed", description: "Admin access removed" });
      setSelectedToRemove(null);
      loadAdmins();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove admin access", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedToDelete) return;
    try {
      const res = await authenticatedFetch(
        `/api/admintvk01/admin-users?userId=${selectedToDelete.id}&mode=delete_user`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete user");
      toast({ title: "Deleted", description: "User document deleted" });
      setSelectedToDelete(null);
      loadAdmins();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const handleCreateAdminByEmail = async () => {
    if (!newAdminEmail.trim()) {
      toast({ title: "Missing Email", description: "Please enter user email", variant: "destructive" });
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail.trim().toLowerCase(),
          adminRole: newAdminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create admin");
      }

      toast({ title: "Success", description: data?.message || "Admin assigned successfully" });
      setNewAdminEmail("");
      setNewAdminRole("content_admin");
      setPreviewUser(null);
      loadAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to assign admin", variant: "destructive" });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSearchUserByEmail = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      toast({ title: "Missing Email", description: "Please enter email to search", variant: "destructive" });
      return;
    }

    setSearchingUser(true);
    try {
      const res = await authenticatedFetch(
        `/api/admintvk01/admin-users?mode=lookup&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "User not found");
      }

      setPreviewUser(data.user || null);
      toast({ title: "User Found", description: "Preview loaded successfully" });
    } catch (error: any) {
      setPreviewUser(null);
      toast({ title: "Search Failed", description: error.message || "User not found", variant: "destructive" });
    } finally {
      setSearchingUser(false);
    }
  };

  if (authLoading || loading) {
    return <Loading text="Loading admin users..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Control</h1>
          <p className="text-muted-foreground">View, edit, remove, and delete admin users role-wise.</p>
        </div>
        <Button variant="outline" onClick={loadAdmins}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {counts.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Create New Admin (By Email)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="new-admin-email">User Email (must login once first)</Label>
              <Input
                id="new-admin-email"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => {
                  setNewAdminEmail(e.target.value);
                  setPreviewUser(null);
                }}
              />
            </div>
            <div>
              <Label htmlFor="new-admin-role">Assign Role</Label>
              <Select value={newAdminRole} onValueChange={(v) => setNewAdminRole(v as RoleOption)}>
                <SelectTrigger id="new-admin-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSearchUserByEmail} disabled={searchingUser}>
                {searchingUser ? "Searching..." : "Search User"}
              </Button>
              <Button onClick={handleCreateAdminByEmail} disabled={creatingAdmin || searchingUser || !canCreateAdmin}>
              {creatingAdmin ? "Assigning..." : "Create Admin"}
              </Button>
            </div>
          </div>

          {!canCreateAdmin && (
            <p className="mt-2 text-xs text-muted-foreground">
              Search user first. Create Admin is enabled only after successful preview.
            </p>
          )}

          {previewUser && (
            <div className="mt-4 rounded-md border p-3 text-sm">
              <div className="font-medium">User Preview</div>
              <div>Name: {previewUser.displayName || "(not set)"}</div>
              <div>Email: {previewUser.email}</div>
              <div>UID: {previewUser.uid}</div>
              <div>Profile: {previewUser.hasFirestoreProfile ? "Firestore profile exists" : "Will auto-create profile on assign"}</div>
              <div>
                Current Role: {previewUser.currentAdminRole || (previewUser.isAdmin ? "isAdmin" : previewUser.role || "student")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Admin Role Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Assign Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.displayName || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">{u.email || "No email"}</div>
                    <div className="text-xs text-muted-foreground">UID: {u.id}</div>
                  </TableCell>
                  <TableCell>
                    {u.adminRole ? (
                      <Badge>{u.adminRole}</Badge>
                    ) : u.isAdmin ? (
                      <Badge variant="secondary">isAdmin</Badge>
                    ) : (
                      <Badge variant="outline">No Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/** Current logged-in super_admin cannot change own role */}
                      {(() => {
                        const selfSuperAdmin = isSelf(u.id) && u.adminRole === "super_admin";
                        return (
                      <Select
                        value={editingRoleByUser[u.id]}
                        disabled={selfSuperAdmin}
                        onValueChange={(v) =>
                          setEditingRoleByUser((prev) => ({
                            ...prev,
                            [u.id]: v as RoleOption,
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        );
                      })()}
                      <Button
                        size="sm"
                        disabled={isSelf(u.id) && u.adminRole === "super_admin"}
                        onClick={() => handleRoleSave(u)}
                      >
                        <UserCog className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf(u.id)}
                        onClick={() => setSelectedToRemove(u)}
                      >
                        Remove Admin
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isSelf(u.id)}
                        onClick={() => setSelectedToDelete(u)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete User
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedToRemove} onOpenChange={() => setSelectedToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin permissions for {selectedToRemove?.email || selectedToRemove?.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selectedToDelete} onOpenChange={() => setSelectedToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user document?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes Firestore user document for {selectedToDelete?.email || selectedToDelete?.id}. Authentication user may still exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
