"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loading from "@/components/ui/loading";
import { Crown, Plus, RefreshCw, Search, ShieldCheck, UserRound, X } from "lucide-react";

type PreviewUser = {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  isPremium: boolean;
  hasFirestoreProfile: boolean;
  premiumCategories?: string[];
  premiumUpdatedAt?: string | null;
};

type PremiumUserRow = {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  isPremium: boolean;
  premiumCategories?: string[];
  premiumUpdatedAt?: string | null;
};

function formatPremiumUpdatedAt(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatPremiumCategories(categories?: string[]) {
  if (!categories || categories.length === 0) {
    return "All Courses";
  }

  if (categories.includes("ALL")) {
    return "All Courses";
  }

  return categories.join(", ");
}

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

const DEFAULT_COURSE_OPTIONS = ["SEBI", "JEE", "BANKING", "SSC", "UPSC", "COAL INDIA LIMITED"];

export default function PremiumUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [availableCourses, setAvailableCourses] = useState<string[]>(DEFAULT_COURSE_OPTIONS);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState("");
  const [newCourseInput, setNewCourseInput] = useState("");
  const [selectedPremiumCategories, setSelectedPremiumCategories] = useState<string[]>([]);
  const [activeLoadCategory, setActiveLoadCategory] = useState<string>("");
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);
  const [allowedExamIdsInput, setAllowedExamIdsInput] = useState("");
  const [allowedPdfIdsInput, setAllowedPdfIdsInput] = useState("");
  const [examsForPicker, setExamsForPicker] = useState<any[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [pdfsForPicker, setPdfsForPicker] = useState<any[]>([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUserRow[]>([]);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listCategoryFilter, setListCategoryFilter] = useState("ALL");

  const previewCategories = (previewUser?.premiumCategories || []).map((item) => normalizeCategory(item));
  const effectiveSelectedCategories =
    selectedPremiumCategories.length > 0 ? selectedPremiumCategories : previewCategories;
  const loadableSelectedCategories = effectiveSelectedCategories.filter((category) => category !== "ALL");

  const listCategoryOptions = useMemo(() => {
    const categoriesFromUsers = premiumUsers.flatMap((u) =>
      (u.premiumCategories || [])
        .map((c) => normalizeCategory(c))
        .filter((c) => c && c !== "ALL")
    );
    return Array.from(new Set([...availableCourses.map((c) => normalizeCategory(c)), ...categoriesFromUsers])).filter(Boolean);
  }, [availableCourses, premiumUsers]);

  const filteredPremiumUsers = useMemo(() => {
    const query = listSearchQuery.trim().toLowerCase();
    const normalizedFilter = normalizeCategory(listCategoryFilter || "ALL");

    return premiumUsers.filter((userRow) => {
      const normalizedCategories = (userRow.premiumCategories || []).map((c) => normalizeCategory(c));

      const matchesCategory =
        normalizedFilter === "ALL" ||
        normalizedCategories.includes(normalizedFilter) ||
        normalizedCategories.includes("ALL");

      if (!matchesCategory) return false;
      if (!query) return true;

      const searchableText = [
        userRow.displayName || "",
        userRow.email || "",
        (userRow.premiumCategories || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [premiumUsers, listSearchQuery, listCategoryFilter]);

  const addCourseToSelection = (course: string) => {
    const normalized = normalizeCategory(course);
    if (!normalized) return;

    setSelectedPremiumCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setAvailableCourses((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setActiveLoadCategory(normalized === "ALL" ? "" : normalized);
  };

  const removeCourseFromSelection = (course: string) => {
    setSelectedPremiumCategories((prev) => {
      const next = prev.filter((item) => item !== course);
      if (activeLoadCategory === course) {
        setActiveLoadCategory(next[next.length - 1] || "");
      }
      return next;
    });
  };

  const loadCourseOptions = async () => {
    try {
      const res = await authenticatedFetch("/api/exam/categories");
      if (!res.ok) return;

      const data = await res.json();
      const categoriesFromApi: string[] = Array.isArray(data.categories)
        ? data.categories
            .map((item: string) => normalizeCategory(item))
            .filter((item: string) => Boolean(item) && item !== "ALL")
        : [];

      const merged = Array.from(new Set([...DEFAULT_COURSE_OPTIONS, ...categoriesFromApi]));
      setAvailableCourses(merged);
    } catch {
      setAvailableCourses(DEFAULT_COURSE_OPTIONS);
    }
  };

  const persistCourseOption = async (rawCourse: string) => {
    const normalized = normalizeCategory(rawCourse);
    if (!normalized) return null;

    const res = await authenticatedFetch("/api/exam/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: normalized }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Could not save course");
    }

    const data = await res.json();
    const categoriesFromApi: string[] = Array.isArray(data.categories)
      ? data.categories
          .map((item: string) => normalizeCategory(item))
          .filter((item: string) => Boolean(item) && item !== "ALL")
      : [];

    setAvailableCourses(Array.from(new Set([...DEFAULT_COURSE_OPTIONS, ...categoriesFromApi])));
    return normalized;
  };

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
    loadCourseOptions();
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
      const nextCategories: string[] = (data.user?.premiumCategories || []).map((item: string) => normalizeCategory(item));
      setSelectedPremiumCategories(nextCategories);
      setActiveLoadCategory(nextCategories.find((category) => category !== "ALL") || "");
      setAllowedExamIdsInput((data.user?.allowedExamIds || []).join(", "));
      setAllowedPdfIdsInput((data.user?.allowedPdfIds || []).join(", "));
      setSelectedExamIds(Array.isArray(data.user?.allowedExamIds) ? data.user.allowedExamIds : []);
      setSelectedPdfIds(Array.isArray(data.user?.allowedPdfIds) ? data.user.allowedPdfIds : []);
      // per-category quotas not used; only explicit IDs are honored
      setAvailableCourses((prev) => Array.from(new Set([...prev, ...nextCategories])));
      setExamsForPicker([]);
      setPdfsForPicker([]);
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

    const selectedCategories = effectiveSelectedCategories;
    const grantAllAccess = selectedCategories.includes("ALL");

    if (nextPremium && selectedCategories.length === 0) {
      toast({
        title: "Missing Courses",
        description: "Enter at least one course/category before granting premium access",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/premium-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: previewUser.uid,
          isPremium: nextPremium,
          premiumCategories: grantAllAccess ? ["ALL"] : selectedCategories.filter((category) => category !== "ALL"),
          grantAllAccess,
          allowedExamIds: grantAllAccess ? [] : (selectedExamIds.length > 0 ? selectedExamIds : (allowedExamIdsInput || "").split(/[,\s]+/).filter(Boolean)),
          allowedPdfIds: grantAllAccess ? [] : (selectedPdfIds.length > 0 ? selectedPdfIds : (allowedPdfIdsInput || "").split(/[,\s]+/).filter(Boolean)),
        }),
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
              premiumCategories: selectedCategories,
              premiumUpdatedAt: new Date().toISOString(),
            }
          : prev
      );

      toast({ title: "Success", description: data?.message || "Updated successfully" });
      setPreviewUser(null);
      setAllowedExamIdsInput("");
      setAllowedPdfIdsInput("");
      setSelectedExamIds([]);
      setSelectedPdfIds([]);
      setActiveLoadCategory("");
      setSelectedPremiumCategories([]);
      setSelectedCourseToAdd("");
      setNewCourseInput("");
      await loadPremiumUsers(true);
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
        body: JSON.stringify({
          userId: target.id,
          isPremium: nextPremium,
          premiumCategories: target.premiumCategories || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      toast({ title: "Updated", description: data?.message || "Premium updated" });
      await loadPremiumUsers(true);
      if (previewUser?.uid === target.id) {
        setPreviewUser({
          ...previewUser,
          isPremium: nextPremium,
          premiumCategories: target.premiumCategories || [],
          premiumUpdatedAt: new Date().toISOString(),
        });
        setSelectedPremiumCategories(nextPremium ? target.premiumCategories || [] : []);
        setActiveLoadCategory(nextPremium ? ((target.premiumCategories || []).find((category) => normalizeCategory(category) !== "ALL") || "") : "");
        setSelectedExamIds([]);
        setSelectedPdfIds([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Update failed", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditFromTable = (target: PremiumUserRow) => {
    setPreviewUser({
      uid: target.id,
      email: target.email || "",
      displayName: target.displayName || "",
      role: target.role || "student",
      isPremium: target.isPremium,
      hasFirestoreProfile: true,
      premiumCategories: target.premiumCategories || [],
      premiumUpdatedAt: target.premiumUpdatedAt,
    });
    setSelectedPremiumCategories((target.premiumCategories || []).map((c) => normalizeCategory(c)));
    setActiveLoadCategory((target.premiumCategories || []).map((category) => normalizeCategory(category)).find((category) => category !== "ALL") || "");
    // If user profile exists, try to load allowed IDs from backend preview user later via handleSearch
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load exams for picker by category
  const loadExamsForPicker = async (categories: string[]) => {
    const nextCategories = Array.from(new Set((categories || []).map((category) => normalizeCategory(category)).filter((category) => category && category !== "ALL")));
    if (nextCategories.length === 0) return setExamsForPicker([]);
    try {
      const responses = await Promise.all(
        nextCategories.map(async (category) => {
          const res = await authenticatedFetch(`/api/exam/list?category=${encodeURIComponent(category)}`);
          if (!res.ok) return [] as any[];
          const data = await res.json();
          return Array.isArray(data.exams) ? data.exams : [];
        })
      );
      const merged = Array.from(
        new Map(responses.flat().map((exam: any) => [exam.id, exam])).values()
      );
      setExamsForPicker(merged);
    } catch {
      setExamsForPicker([]);
    }
  };

  const toggleExamSelection = (id: string) => {
    setSelectedExamIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setAllowedExamIdsInput(next.join(', '));
      return next;
    });
  };

  // Load PDFs for picker by category (flattened)
  const loadPdfsForPicker = async (categories: string[]) => {
    try {
      const res = await authenticatedFetch(`/api/pdf/list`);
      if (!res.ok) return setPdfsForPicker([]);
      const data = await res.json();
      const folders = Array.isArray(data.folders) ? data.folders : [];
      const allFiles: any[] = [];
      folders.forEach((f: any) => {
        (f.files || []).forEach((file: any) => allFiles.push(file));
      });
      const categorySet = new Set((categories || []).map((category) => normalizeCategory(category)).filter((category) => category && category !== "ALL"));
      const filtered = categorySet.size > 0
        ? allFiles.filter((f) => categorySet.has(normalizeCategory(f.category || f.folderCategory || "")))
        : [];
      setPdfsForPicker(filtered);
    } catch {
      setPdfsForPicker([]);
    }
  };

  const togglePdfSelection = (id: string) => {
    setSelectedPdfIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setAllowedPdfIdsInput(next.join(', '));
      return next;
    });
  };

  // per-category quotas removed; only explicit IDs are used

  const handleUpdateAccess = async () => {
    if (!previewUser || !previewUser.isPremium) return;

    const selectedCategories = effectiveSelectedCategories;
    const grantAllAccess = selectedCategories.includes("ALL");
    if (selectedCategories.length === 0) {
      toast({
        title: "Missing Courses",
        description: "Select at least one course/category for premium access",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/admintvk01/premium-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: previewUser.uid,
          isPremium: true,
          premiumCategories: grantAllAccess ? ["ALL"] : selectedCategories.filter((category) => category !== "ALL"),
          grantAllAccess,
          allowedExamIds: grantAllAccess ? [] : (selectedExamIds.length > 0 ? selectedExamIds : (allowedExamIdsInput || "").split(/[,\s]+/).filter(Boolean)),
          allowedPdfIds: grantAllAccess ? [] : (selectedPdfIds.length > 0 ? selectedPdfIds : (allowedPdfIdsInput || "").split(/[,\s]+/).filter(Boolean)),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update premium access");
      }

      setPreviewUser((prev) =>
        prev
          ? {
              ...prev,
              premiumCategories: selectedCategories,
              premiumUpdatedAt: new Date().toISOString(),
            }
          : prev
      );

      toast({ title: "Updated", description: "Premium access updated successfully" });
      setPreviewUser(null);
      setExamsForPicker([]);
      setPdfsForPicker([]);
      setSelectedPremiumCategories([]);
      setSelectedCourseToAdd("");
      setNewCourseInput("");
      await loadPremiumUsers(true);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update access",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
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

          <div className="space-y-2">
            <Label htmlFor="premium-categories">Premium Courses</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-3">
                <Select
                  value={selectedCourseToAdd}
                  onValueChange={(value) => {
                    setSelectedCourseToAdd(value);
                    setExamsForPicker([]);
                    setPdfsForPicker([]);
                    setSelectedExamIds([]);
                    setSelectedPdfIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course/category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                    <SelectItem value="ALL">ALL (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!selectedCourseToAdd) return;
                  addCourseToSelection(selectedCourseToAdd);
                  setSelectedCourseToAdd("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-3">
                <Input
                  id="premium-categories"
                  placeholder="Add new course e.g. CAT"
                  value={newCourseInput}
                  onChange={(e) => setNewCourseInput(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    const normalized = await persistCourseOption(newCourseInput);
                    if (!normalized) return;
                    addCourseToSelection(normalized);
                    setNewCourseInput("");
                    toast({ title: "Course Added", description: `${normalized} saved successfully` });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Could not add course",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>

            {effectiveSelectedCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {effectiveSelectedCategories.map((course) => (
                  <Badge key={course} variant="secondary" className="gap-1">
                    {course}
                    <button
                      type="button"
                      aria-label={`Remove ${course}`}
                      onClick={() => removeCourseFromSelection(course)}
                      className="inline-flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No course selected yet</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select one or more courses. If a new exam course is created later, you can add it from this dropdown after refresh, or use New.
            </p>
          </div>

          {previewUser && (
            <div className="space-y-3">
              {effectiveSelectedCategories.includes("ALL") ? (
                <p className="text-xs text-emerald-600">Full access selected. No category-specific loading is needed.</p>
              ) : loadableSelectedCategories.length === 0 ? (
                <p className="text-xs text-destructive">Select a category above before loading exams or PDFs.</p>
              ) : null}

              <div className="space-y-2">
                <Label>Allowed Exam IDs (comma or space separated)</Label>
                <div className="flex gap-2">
                  <Input
                    value={allowedExamIdsInput}
                    onChange={(e) => setAllowedExamIdsInput(e.target.value)}
                    placeholder="e.g. examId1, examId2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadExamsForPicker(loadableSelectedCategories)}
                    disabled={loadableSelectedCategories.length === 0}
                    className="whitespace-nowrap"
                  >
                    Load Exams
                  </Button>
                </div>
              </div>

              {examsForPicker.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold">Select Exams to Grant</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {examsForPicker.map((ex) => (
                      <label key={ex.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedExamIds.includes(ex.id)} onChange={() => toggleExamSelection(ex.id)} />
                        <span className="text-sm">{ex.title} <span className="text-xs text-muted-foreground">({ex.id})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Allowed PDF IDs (comma or space separated)</Label>
                <div className="flex gap-2">
                  <Input
                    value={allowedPdfIdsInput}
                    onChange={(e) => setAllowedPdfIdsInput(e.target.value)}
                    placeholder="e.g. pdfId1, pdfId2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadPdfsForPicker(loadableSelectedCategories)}
                    disabled={loadableSelectedCategories.length === 0}
                    className="whitespace-nowrap"
                  >
                    Load PDFs
                  </Button>
                </div>
              </div>

              {pdfsForPicker.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold">Select PDFs to Grant</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {pdfsForPicker.map((f) => (
                      <label key={f.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedPdfIds.includes(f.id)} onChange={() => togglePdfSelection(f.id)} />
                        <span className="text-sm">{f.title || f.name} <span className="text-xs text-muted-foreground">({f.id})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {previewUser && (
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <div className="font-semibold flex items-center gap-2">
                <UserRound className="h-4 w-4" /> User Preview
              </div>
              <div>Name: {previewUser.displayName || "(not set)"}</div>
              <div>Email: {previewUser.email}</div>
              <div>UID: {previewUser.uid}</div>
              <div>Role: {previewUser.role || "student"}</div>
              <div>Courses: {formatPremiumCategories(previewUser.premiumCategories)}</div>
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
                {!previewUser.isPremium && (
                  <Button
                    onClick={() => handleSetPremium(true)}
                    disabled={saving}
                  >
                    <Crown className="h-4 w-4 mr-1" /> Make Premium
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={handleUpdateAccess}
                  disabled={saving || !previewUser.isPremium}
                >
                  Update Access
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
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="premium-users-list-search">Search Users</Label>
              <Input
                id="premium-users-list-search"
                placeholder="Search by name, email, or course"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="premium-users-category-filter">Category Filter</Label>
              <Select value={listCategoryFilter} onValueChange={setListCategoryFilter}>
                <SelectTrigger id="premium-users-category-filter">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {listCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
              {filteredPremiumUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users match your search/filter
                  </TableCell>
                </TableRow>
              ) : (
                filteredPremiumUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.displayName || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{u.email || "No email"}</div>
                      <div className="text-xs text-muted-foreground">
                        Courses: {formatPremiumCategories(u.premiumCategories)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.isPremium ? <Badge>Premium</Badge> : <Badge variant="secondary">Non Premium</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPremiumUpdatedAt(u.premiumUpdatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={refreshing}
                          onClick={() => handleEditFromTable(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={refreshing}
                          onClick={() => handleInlineToggle(u, !u.isPremium)}
                        >
                          {u.isPremium ? "Remove" : "Make Premium"}
                        </Button>
                      </div>
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
