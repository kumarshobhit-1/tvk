"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, TrendingUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Loading from "@/components/ui/loading";
import type { LeaderboardEntry } from "@/lib/exam-types";

function toSlug(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.slug as string;
  const { user, loading: authLoading } = useRequireAuth();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [examCategory, setExamCategory] = useState<string | null>(null);
  const itemsPerPage = 25;

  useEffect(() => {
    document.title = "Leaderboard | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Fetch exam info to get category
        const examResponse = await fetch(`/api/exam/list?examId=${examId}`);
        const examData = await examResponse.json();
        if (examData.exams && examData.exams[0]) {
          setExamCategory(examData.exams[0].category);
        }

        // Fetch leaderboard
        const response = await fetch(`/api/exam/leaderboard?examId=${examId}`);
        const data = await response.json();
        
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setFilteredLeaderboard(data.leaderboard);
        } else {
          setLeaderboard([]);
          setFilteredLeaderboard([]);
        }
        setError("");
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("");
        setLeaderboard([]);
        setFilteredLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, authLoading, examId]);

  // Filter leaderboard based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeaderboard(leaderboard);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = leaderboard.filter(
        (entry) =>
          entry.userName.toLowerCase().includes(query)
      );
      setFilteredLeaderboard(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, leaderboard]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaderboard = filteredLeaderboard.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of leaderboard
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => {
            if (examCategory) {
              router.push(`/exam/category/${toSlug(examCategory)}`);
            } else {
              router.push("/exam");
            }
          }}
          className="mb-4"
        >
          ← Back to Exams
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <CardTitle className="text-2xl">Leaderboard</CardTitle>
              </div>
              <Badge variant="secondary">{filteredLeaderboard.length} Students</Badge>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLeaderboard.length)} of {filteredLeaderboard.length}
              </div>
            )}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No students found matching your search." : "No attempts yet. Be the first to take this exam!"}
              </div>
            ) : (
              <div className="space-y-2">
                {currentLeaderboard.map((entry, index) => (
                  (() => {
                    const rank = entry.rank || index + 1;
                    const isTopThree = rank <= 3;
                    const medalColors = ["text-yellow-500", "text-gray-400", "text-orange-600"];
                    const isCurrentUser = user?.uid === entry.userId;

                    return (
                      <div
                        key={`${entry.userId}-${index}`}
                        className={
                          `
                        flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border transition-all
                        ${isTopThree ? "bg-accent" : "bg-background"}
                        ${rank === 1 ? "border-yellow-500 shadow-md" : ""}
                        ${rank === 2 ? "border-gray-400" : ""}
                        ${rank === 3 ? "border-orange-600" : ""}
                        ${isCurrentUser ? "ring-2 ring-primary" : ""}
                        `
                        }
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div
                            className={`
                            flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg
                            ${isTopThree ? "bg-primary text-primary-foreground" : "bg-muted"}
                          `}
                          >
                            {isTopThree ? (
                              <Trophy className={`h-6 w-6 ${medalColors[rank - 1]}`} />
                            ) : (
                              <span className="text-sm">#{rank}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{entry.userName}</p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(entry.timeTaken)}</span>
                            </div>
                          </div>

                          <div className="min-w-[80px] text-right sm:text-center">
                            <Badge
                              variant={entry.percentage >= 75 ? "default" : entry.percentage >= 50 ? "secondary" : "destructive"}
                              className="mb-1 block"
                            >
                              {entry.percentage.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-muted-foreground">percentage</p>
                          </div>

                          <div className="min-w-[60px] text-right sm:text-center">
                            <p className="font-bold text-lg">{entry.score.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">score</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(1)}
                        className="w-10"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2">...</span>}
                    </>
                  )}

                  {/* Pages around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1 ||
                             (currentPage <= 2 && page <= 3) ||
                             (currentPage >= totalPages - 1 && page >= totalPages - 2);
                    })
                    .map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        className="w-10"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
