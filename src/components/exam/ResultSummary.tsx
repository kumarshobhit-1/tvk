"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Trophy, Award, Share2, Twitter, MessageCircle, Linkedin, Copy, Check, ChevronRight, BarChart3, Target, Zap, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ExamResult } from "@/lib/exam-types";

interface ResultSummaryProps {
  result: ExamResult;
  onReviewAnswers: () => void;
  studentName?: string;
  studentEmail?: string;
}

export function ResultSummary({ result, onReviewAnswers, studentName, studentEmail }: ResultSummaryProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const formatSubmittedDate = (value: unknown): string => {
    if (!value) return 'N/A';

    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
      const date = (value as any).toDate();
      return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
    }

    if (typeof value === 'string' || value instanceof Date) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
    }

    if (typeof value === 'object' && value !== null) {
      const seconds = (value as any).seconds ?? (value as any)._seconds;
      if (typeof seconds === 'number') {
        const date = new Date(seconds * 1000);
        return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
      }
    }

    return 'N/A';
  };
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getShareText = (platform: 'twitter' | 'whatsapp' | 'linkedin') => {
    const emoji = result.passed ? '🎯' : '💪';
    const status = result.passed ? 'PASSED' : 'ATTEMPTED';
    const score = result.percentage.toFixed(1);
    const correctCount = result.correctAnswers;
    const totalCount = result.correctAnswers + result.wrongAnswers + result.unanswered;
    
    if (platform === 'twitter') {
      return `🔑 ${status}: ${result.examTitle || 'Exam'}\n\n📊 Score: ${score}%\n✅ Correct: ${correctCount}/${totalCount}\n\n${emoji} Powered by The Victory Key\n#Coding #TechExam #TheVictoryKey`;
    } else if (platform === 'whatsapp') {
      return `🔑 *The Victory Key - Exam Result*\n\n${emoji} I ${status} the *${result.examTitle || 'exam'}*!\n\n📊 *Score:* ${score}%\n✅ *Correct:* ${correctCount}/${totalCount}\n⏱ *Time:* ${formatTime(result.timeTaken)}\n\nCheck out my result:`;
    } else {
      return `I ${status.toLowerCase()} the ${result.examTitle || 'exam'} with ${score}% score on The Victory Key! 🎓\n\nCorrect Answers: ${correctCount}/${totalCount}\nTime Taken: ${formatTime(result.timeTaken)}`;
    }
  };
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform: 'twitter' | 'whatsapp' | 'linkedin') => {
    const shareText = getShareText(platform);
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let url = '';
    switch(platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPerformanceLevel = () => {
    if (result.percentage >= 90) return { label: "Outstanding", color: "emerald", emoji: "🌟" };
    if (result.percentage >= 75) return { label: "Excellent", color: "green", emoji: "✨" };
    if (result.percentage >= 60) return { label: "Very Good", color: "blue", emoji: "👍" };
    if (result.percentage >= 50) return { label: "Good", color: "yellow", emoji: "📈" };
    return { label: "Needs Improvement", color: "orange", emoji: "💪" };
  };

  const performance = getPerformanceLevel();
  const totalQuestions = result.correctAnswers + result.wrongAnswers + result.unanswered;
  const percentage = result.percentage.toFixed(0);
  const passingPercentage = result.passingPercentage || (result.passingMarks ? ((result.passingMarks / result.totalMarks) * 100).toFixed(0) : '50');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Marksheet Style Card */}
        <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-800 overflow-hidden animate-in fade-in slide-in-from-top duration-700 relative">
          {/* Stamp/Seal on Result */}
          {result.passed && (
            <div className="absolute top-32 right-8 z-10 opacity-20 dark:opacity-10 pointer-events-none">
              <div className="relative w-40 h-40 rounded-full border-8 border-emerald-600 dark:border-emerald-400 flex items-center justify-center rotate-12 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight mb-1">THE VICTORY KEY</div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">PASSED</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">✓ VERIFIED</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-900 dark:to-slate-800 p-6 text-center border-b-4 border-blue-800 dark:border-slate-700">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-white rounded-full p-3 shadow-lg dark:bg-slate-100">
                <Trophy className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-1">
              THE VICTORY KEY
            </h1>
            <p className="text-blue-100 text-sm font-semibold">
              Website: www.thevictorykey.com
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Student Information */}
            <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Student Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {studentName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email ID</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {studentEmail || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Exam Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {result.examTitle || 'Examination'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Date</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {formatSubmittedDate(result.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Marks Table */}
            <div className="border-2 border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-cyan-500 text-white p-3">
                <div className="grid grid-cols-2 font-bold">
                  <div>Questions</div>
                  <div className="text-right">Marks Obtained</div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-slate-700 dark:text-slate-300">Correct Answers</div>
                  <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {result.correctAnswers}/{totalQuestions}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 p-3">
                  <div className="text-slate-700 dark:text-slate-300">Wrong Answers</div>
                  <div className="text-right font-bold text-red-600 dark:text-red-400">
                    {result.wrongAnswers}/{totalQuestions}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-slate-700 dark:text-slate-300">Unanswered</div>
                  <div className="text-right font-bold text-slate-600 dark:text-slate-400">
                    {result.unanswered}/{totalQuestions}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 p-3">
                  <div className="text-slate-700 dark:text-slate-300">Time Taken</div>
                  <div className="text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(result.timeTaken)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 p-4 bg-cyan-50 dark:bg-cyan-950/30 border-t-2 border-cyan-500">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Result:</span>
                    <Badge className={result.passed ? 'bg-emerald-600' : 'bg-slate-600'}>
                      {performance.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Total</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {result.score.toFixed(1)}/{result.totalMarks}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Status Box */}
            <div className={`border-2 rounded-lg p-4 text-center ${
              result.passed 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {result.passed ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-amber-600" />
                )}
                <h3 className={`text-2xl font-black ${
                  result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {result.passed ? 'PASSED' : 'NOT PASSED'}
                </h3>
              </div>
              <p className={`text-lg font-bold ${
                result.passed ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'
              }`}>
                Your Percentage: {percentage}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Passing Percentage Required: {passingPercentage}%
              </p>
            </div>

            {/* Footer Note */}
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-3">
                Developed And Designed By The Victory Key - Get This System Contact: Consultantstvk@gmail.com
              </p>
              <p className="text-xs text-center text-slate-600 dark:text-slate-400 italic">
                Note: Notice on Net - Results published on net are immediate information for Students. 
                This cannot be treated as Original Mark sheet/Passing Certificate issued by Your School/Institute
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share & Actions Section */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Share Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 hover:shadow-xl transition-shadow duration-300 overflow-hidden animate-in fade-in slide-in-from-left duration-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-white" />
                <h3 className="font-bold text-white text-lg">Share Result</h3>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => handleShare('twitter')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-transform duration-200 dark:bg-white/10 dark:hover:bg-white/15"
                  size="sm"
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-transform duration-200 dark:bg-white/10 dark:hover:bg-white/15"
                  size="sm"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  onClick={() => handleShare('linkedin')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-transform duration-200 dark:bg-white/10 dark:hover:bg-white/15"
                  size="sm"
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </Button>
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-transform duration-200 dark:bg-white/10 dark:hover:bg-white/15"
                  size="sm"
                >
                  {copySuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right duration-700" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6 space-y-3">
              <Button 
                onClick={onReviewAnswers} 
                size="lg"
                className="w-full h-12 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:scale-105 transition-all duration-300 group"
              >
                Review Answers
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="w-full h-12 font-bold border-2 hover:scale-105 transition-all duration-300 group"
              >
                <Link href="/exam">
                  Back to Exams
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}