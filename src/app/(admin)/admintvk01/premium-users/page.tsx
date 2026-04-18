"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loading from "@/components/ui/loading";
import { Crown, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";

type PreviewUser = {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  isPremium: boolean;
  hasFirestoreProfile: boolean;
  premiumUpdatedAt?: string | null;
};

type PremiumUserRow = {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  isPremium: boolean;
  premiumUpdatedAt?: string | null;
};

function formatPremiumUpdatedAt(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function PremiumUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUserRow[]>([]);

  const loadPremiumUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/premium-users");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch premium users");

      const data = await res.json();
      setPremiumUsers(data.users || []);
    } catch {
      toast({
        title: "Error",
        description: "Could not load premium users",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    loadPremiumUsers();
  }, [authLoading, user]);

  const handleSearch = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      toast({ title: "Missing Email", description: "Please enter email", variant: "destructive" });
      return;
    }

    setSearching(true);
    try {
      const res = await authenticatedFetch(
        `/api/admintvk01/premium-users?mode=lookup&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "User not found");
      }

      setPreviewUser(data.user || null);
      toast({ title: "User Found", description: "User preview loaded" });
    } catch (error: any) {
      setPreviewUser(null);
      toast({
        title: "Search Failed",
        description: error.message || "User not found",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSetPremium = async (nextPremium: boolean) => {
    if (!previewUser) return;

    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/premium-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: previewUser.uid, isPremium: nextPremium }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update premium status");
      }

      setPreviewUser((prev) =>
        prev
          ? {
              ...prev,
              isPremium: nextPremium,
              premiumUpdatedAt: new Date().toISOString(),
            }
          : prev
      );

      toast({ title: "Success", description: data?.message || "Updated successfully" });
      loadPremiumUsers(true);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update premium status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInlineToggle = async (target: PremiumUserRow, nextPremium: boolean) => {
    setRefreshing(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/premium-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, isPremium: nextPremium }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      toast({ title: "Updated", description: data?.message || "Premium updated" });
      await loadPremiumUsers(true);
      if (previewUser?.uid === target.id) {
        setPreviewUser({
          ...previewUser,
          isPremium: nextPremium,
          premiumUpdatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Update failed", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return <Loading text="Loading premium controls..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Premium User Management</h1>
          <p className="text-muted-foreground">
            Search user by email and grant/revoke premium access.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadPremiumUsers()} disabled={refreshing}>
          <RefreshCw className="h-4 w-4 mr-2" /> {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Search User By Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-3">
              <Label htmlFor="search-email">Email</Label>
              <Input
                id="search-email"
                type="email"
                placeholder="user@example.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setPreviewUser(null);
                }}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {previewUser && (
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <div className="font-semibold flex items-center gap-2">
                <UserRound className="h-4 w-4" /> User Preview
              </div>
              <div>Name: {previewUser.displayName || "(not set)"}</div>
              <div>Email: {previewUser.email}</div>
              <div>UID: {previewUser.uid}</div>
              <div>Role: {previewUser.role || "student"}</div>
              <div>
                Status:{" "}
                {previewUser.isPremium ? (
                  <Badge className="ml-1">Premium</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-1">
                    Non Premium
                  </Badge>
                )}
              </div>
              <div className="pt-2 flex gap-2">
                <Button
                  onClick={() => handleSetPremium(true)}
                  disabled={saving || previewUser.isPremium}
                >
                  <Crown className="h-4 w-4 mr-1" /> Make Premium
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSetPremium(false)}
                  disabled={saving || !previewUser.isPremium}
                >
                  Remove Premium
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Current Premium Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {premiumUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No premium users found
                  </TableCell>
                </TableRow>
              ) : (
                premiumUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.displayName || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{u.email || "No email"}</div>
                    </TableCell>
                    <TableCell>
                      {u.isPremium ? <Badge>Premium</Badge> : <Badge variant="secondary">Non Premium</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPremiumUpdatedAt(u.premiumUpdatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={() => handleInlineToggle(u, !u.isPremium)}
                      >
                        {u.isPremium ? "Remove" : "Make Premium"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
