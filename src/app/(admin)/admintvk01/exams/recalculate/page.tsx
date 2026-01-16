"use client";

import { authenticatedFetch } from "@/lib/api-client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertCircle, Info } from "lucide-react";

export default function RecalculatePage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Recalculate Results - Admin | The Victory Key";
  }, []);

  const handleRecalculate = async () => {
    if (!confirm("Are you sure you want to recalculate all exam results? This will update the passed/failed status based on the new percentage-based logic.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch("/api/exam/recalculate", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to recalculate");

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Updated ${data.updated} attempts. Errors: ${data.errors}`,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Recalculate Exam Results</CardTitle>
            <CardDescription>
              Update all exam attempts with the latest scoring and passing logic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What it does */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>What it does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Recalculates all old exam results with the latest logic</li>
                  <li>Applies percentage-based passing marks (e.g., 40% minimum)</li>
                  <li>Updates Pass/Fail status according to new criteria</li>
                  <li>Properly applies negative marking rules</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* When to use */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>When to use:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>Changed passing marks:</strong> From 50% to 40%</li>
                  <li><strong>Fixed scoring logic:</strong> There was a negative marking issue</li>
                  <li><strong>Fix incorrect results:</strong> Old results were calculated incorrectly</li>
                  <li><strong>Updated exam settings:</strong> Changed marks distribution</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Example */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Example</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-red-600 dark:text-red-400">❌ Before:</p>
                    <ul className="space-y-1 pl-4">
                      <li>• Student score: 45/100 (45%)</li>
                      <li>• Passing marks: 50%</li>
                      <li>• Status: <span className="font-bold text-red-600">Failed</span></li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-600 dark:text-green-400">✓ After:</p>
                    <ul className="space-y-1 pl-4">
                      <li>• Student score: 45/100 (45%)</li>
                      <li>• Passing marks: 40% (changed)</li>
                      <li>• Status: <span className="font-bold text-green-600">Passed</span></li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  After recalculation, the student will automatically pass because the passing criteria is now 40%.
                </p>
              </CardContent>
            </Card>

            {/* Warning */}
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Warning:</strong> This action will update all exam results. 
                Students' pass/fail status may change. Proceed with caution!
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRecalculate}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Recalculating..." : "Recalculate All Results"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
