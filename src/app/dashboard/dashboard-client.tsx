// src/app/dashboard/dashboard-client.tsx

"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Code, Database, Clock, Trophy, Target, TrendingUp, Flame, RefreshCw, FileText, CheckCircle, XCircle, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import type { DsaTopic, DsaQuestion, CsSubject, CsTopic } from '@/lib/types';

interface ExamAttempt {
  id: string;
  examTitle: string;
  examId: string;
  passed: boolean;
  percentage: number;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

interface ExamStats {
  totalAttempts: number;
  passedExams: number;
  averageScore: number;
  recentAttempts: ExamAttempt[];
}

interface DashboardClientProps {
  user: { name: string; email: string; picture: string };
  userProgress: Record<string, boolean>;
  allDsaTopics: DsaTopic[];
  allDsaQuestions: DsaQuestion[];
  allCsSubjects: CsSubject[];
  allCsTopics: CsTopic[];
  userStreak?: number;
  recentActivity?: Array<{ id: string; title: string; type: 'dsa' | 'cs'; timestamp: string }>;
  examStats?: ExamStats;
}

interface TopicProgress {
  name: string;
  progress: number;
  completedCount: number;
  totalCount: number;
}

const chartConfig = {
  value: { label: "Progress" },
  cs: { label: "CS", color: "hsl(var(--chart-1))" },
  dsa: { label: "DSA", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function DashboardClient({
  user,
  userProgress,
  allDsaTopics,
  allDsaQuestions,
  allCsSubjects,
  allCsTopics,
  userStreak = 0,
  recentActivity = [],
  examStats = { totalAttempts: 0, passedExams: 0, averageScore: 0, recentAttempts: [] }
}: DashboardClientProps) {
  const router = useRouter();

  // Update document title with user name
  useEffect(() => {
    if (user?.name) {
      document.title = `${user.name}'s Dashboard | The Victory Key`;
    }
  }, [user?.name]);

  const progressData = useMemo(() => {
    const dsaProgressDetails: TopicProgress[] = [];
    let completedDsaTopicsCount = 0;
    allDsaTopics.forEach(topic => {
      const questionsForTopic = allDsaQuestions.filter(q => q.dsaTopicId === topic.id);
      const totalQuestions = questionsForTopic.length;
      const completedQuestions = questionsForTopic.filter(q => userProgress[q.id]).length;
      const progressValue = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
      if (progressValue === 100 && totalQuestions > 0) completedDsaTopicsCount++;
      dsaProgressDetails.push({ name: topic.name, progress: progressValue, completedCount: completedQuestions, totalCount: totalQuestions });
    });

    const csProgressDetails: TopicProgress[] = [];
    let completedCsSubjectsCount = 0;
    allCsSubjects.forEach(subject => {
      const topicsForSubject = allCsTopics.filter(t => t.csSubjectId === subject.id);
      const totalTopics = topicsForSubject.length;
      const completedTopics = topicsForSubject.filter(t => userProgress[t.id]).length;
      const progressValue = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
      if (progressValue === 100 && totalTopics > 0) completedCsSubjectsCount++;
      csProgressDetails.push({ name: subject.name, progress: progressValue, completedCount: completedTopics, totalCount: totalTopics });
    });

    return {
      dsa: { completed: completedDsaTopicsCount, total: allDsaTopics.length, topics: dsaProgressDetails },
      cs: { completed: completedCsSubjectsCount, total: allCsSubjects.length, subjects: csProgressDetails },
    };
  }, [userProgress, allDsaTopics, allDsaQuestions, allCsSubjects, allCsTopics]);

  const csPercentage = progressData.cs.total > 0 ? (progressData.cs.completed / progressData.cs.total) * 100 : 0;
  const dsaPercentage = progressData.dsa.total > 0 ? (progressData.dsa.completed / progressData.dsa.total) * 100 : 0;

  // Calculate total completed items
  const totalCompleted = Object.values(userProgress).filter(Boolean).length;
  
  // Calculate achievements
  const achievements = useMemo(() => {
    const earned = [];
    if (totalCompleted >= 1) earned.push({ name: 'First Step', icon: '🎯', description: 'Completed first item' });
    if (totalCompleted >= 10) earned.push({ name: 'Getting Started', icon: '🚀', description: 'Completed 10 items' });
    if (totalCompleted >= 50) earned.push({ name: 'Making Progress', icon: '💪', description: 'Completed 50 items' });
    if (totalCompleted >= 100) earned.push({ name: 'Century Club', icon: '💯', description: 'Completed 100 items' });
    if (userStreak >= 3) earned.push({ name: '3 Day Streak', icon: '🔥', description: 'Practiced 3 days in a row' });
    if (userStreak >= 7) earned.push({ name: 'Week Warrior', icon: '⚡', description: 'Practiced 7 days in a row' });
    if (userStreak >= 30) earned.push({ name: 'Monthly Master', icon: '👑', description: 'Practiced 30 days in a row' });
    if (progressData.dsa.completed > 0 && progressData.dsa.completed === progressData.dsa.total) {
      earned.push({ name: 'DSA Champion', icon: '🏆', description: 'Completed all DSA topics' });
    }
    if (progressData.cs.completed > 0 && progressData.cs.completed === progressData.cs.total) {
      earned.push({ name: 'CS Master', icon: '🎓', description: 'Completed all CS subjects' });
    }
    return earned;
  }, [totalCompleted, userStreak, progressData]);

  const chartData = [
    { category: "CS Subjects", value: csPercentage, fill: "var(--color-cs)" },
    { category: "DSA Topics", value: dsaPercentage, fill: "var(--color-dsa)" },
  ];

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <Card className="border-none bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-emerald-200 dark:ring-emerald-800">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="text-muted-foreground">Here's a quick look at your learning journey.</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.refresh()}
              title="Refresh dashboard data"
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Completed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Completed</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userStreak}</p>
                <p className="text-xs text-muted-foreground mt-1">days</p>
              </div>
              <Flame className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{achievements.length}</p>
                <p className="text-xs text-muted-foreground mt-1">earned</p>
              </div>
              <Trophy className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Exams Passed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exams Passed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{examStats.passedExams}</p>
                <p className="text-xs text-muted-foreground mt-1">of {examStats.totalAttempts}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{examStats.averageScore.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">overall</p>
              </div>
              <Award className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CS Stat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code size={18} className="text-blue-500" />
              CS Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{progressData.cs.completed}</span>
              <span className="text-sm text-muted-foreground">of {progressData.cs.total} completed</span>
            </div>
            <Progress value={csPercentage} />
            <div className="text-xs text-muted-foreground">{Math.round(csPercentage)}% overall</div>
          </CardContent>
        </Card>

        {/* DSA Stat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={18} className="text-green-500" />
              DSA Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{progressData.dsa.completed}</span>
              <span className="text-sm text-muted-foreground">of {progressData.dsa.total} completed</span>
            </div>
            <Progress value={dsaPercentage} />
            <div className="text-xs text-muted-foreground">{Math.round(dsaPercentage)}% overall</div>
          </CardContent>
        </Card>

        {/* Overview Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tickMargin={6} width={90} className="text-sm" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => `${Number(v).toFixed(0)}%`} />} />
                  <Bar dataKey="value" radius={6} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CS List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code size={18} className="text-blue-500" />
              Computer Science Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressData.cs.completed}/{progressData.cs.total} subjects</span>
            </div>
            <Progress value={csPercentage} className="h-2" />
            <ScrollArea className="max-h-80 pr-2">
              <div className="space-y-3 mt-2">
                {progressData.cs.subjects.map((subject) => (
                  <div key={subject.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{subject.name} ({subject.completedCount}/{subject.totalCount})</span>
                      <span>{Math.round(subject.progress)}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* DSA List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={18} className="text-green-500" />
              DSA Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressData.dsa.completed}/{progressData.dsa.total} topics</span>
            </div>
            <Progress value={dsaPercentage} className="h-2" />
            <ScrollArea className="max-h-80 pr-2">
              <div className="space-y-3 mt-2">
                {progressData.dsa.topics.map((topic) => (
                  <div key={topic.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{topic.name} ({topic.completedCount}/{topic.totalCount})</span>
                      <span>{Math.round(topic.progress)}%</span>
                    </div>
                    <Progress value={topic.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Achievements and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" />
              Recent Exam Activity
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/exam">View All Exams</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {examStats.recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {examStats.recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
                    <div className={`p-3 rounded-xl ${
                      attempt.passed 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    }`}>
                      {attempt.passed ? (
                        <Trophy className="h-6 w-6 text-white" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{attempt.examTitle}</h4>
                        <Badge 
                          variant={attempt.passed ? "default" : "secondary"}
                          className={attempt.passed ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
                        >
                          {attempt.passed ? "Passed" : "Not Passed"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {(attempt.percentage || 0).toFixed(1)}% ({attempt.score}/{attempt.totalMarks})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/exam/result?attemptId=${attempt.id}`}>View Result</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No Exam Attempts Yet</p>
                <p className="text-sm mb-4">Start taking exams to track your progress!</p>
                <Button asChild>
                  <Link href="/exam">Browse Exams</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={18} className="text-purple-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="grid grid-cols-1 gap-3">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">Earned</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start completing items to earn achievements!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      {activity.type === 'dsa' ? (
                        <Database className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <Code className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant={activity.type === 'dsa' ? 'default' : 'secondary'} className="text-xs">
                        {activity.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity yet. Start learning!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
