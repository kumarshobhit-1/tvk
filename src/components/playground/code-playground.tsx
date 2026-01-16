"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, Copy, Check, Download, Loader2, Save, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { saveCode, loadCode, hasSavedCode } from "@/lib/code-storage";

// Types
interface Example {
  input: string;
  output: string;
  explanation: string;
}

interface DSAProblem {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  examples: Example[];
  constraints: string[];
  templates: {
    javascript: string;
    python: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
}

// Language configurations
const languages = [
  { id: "javascript", name: "JavaScript", extension: "js" },
  { id: "python", name: "Python", extension: "py" },
  { id: "java", name: "Java", extension: "java" },
  { id: "cpp", name: "C++", extension: "cpp" },
  { id: "c", name: "C", extension: "c" },
];

// Default code templates
const defaultCode: Record<string, string> = {
  javascript: `// JavaScript Playground
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));

// Example: Array operations
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(n => n * n);
console.log("Squared:", squared);`,

  python: `# Python Playground
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

# Example: List comprehension
numbers = [1, 2, 3, 4, 5]
squared = [n**2 for n in numbers]
print("Squared:", squared)`,

  java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
        
        // Example: Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        for (int num : numbers) {
            System.out.println("Squared: " + (num * num));
        }
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

  cpp: `// C++ Playground
#include <iostream>
#include <vector>
using namespace std;

string greet(string name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << greet("World") << endl;
    
    // Example: Vector operations
    vector<int> numbers = {1, 2, 3, 4, 5};
    for (int num : numbers) {
        cout << "Squared: " << num * num << endl;
    }
    
    return 0;
}`,

  c: `// C Playground
#include <stdio.h>
#include <string.h>

void greet(char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    greet("World");
    
    // Example: Array operations
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    
    for (int i = 0; i < size; i++) {
        printf("Squared: %d\\n", numbers[i] * numbers[i]);
    }
    
    return 0;
}`,
};

// DSA Problems are now fetched from Firebase in the component
// Previously hardcoded problems have been moved to Firebase playground_problems collection

export function CodePlayground() {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(defaultCode.java);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [dsaProblems, setDsaProblems] = useState<DSAProblem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Save/Load states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch problems from API
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/playground/problems');
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        const data = await response.json();
        setDsaProblems(data.problems || []);
      } catch (error) {
        console.error("Error fetching problems:", error);
        toast({
          title: "Error",
          description: "Failed to load problems. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setProblemsLoading(false);
      }
    };
    fetchProblems();
  }, [toast]);

  // Filtered problems based on search and filters
  const filteredProblems = dsaProblems.filter((problem) => {
    // Search filter
    if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !problem.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Difficulty filter
    if (selectedDifficulty && problem.difficulty !== selectedDifficulty) {
      return false;
    }
    
    // Category filter
    if (selectedCategory && problem.category !== selectedCategory) {
      return false;
    }
    
    // Status filter (TODO: Implement with saved progress)
    // Will be implemented with save code feature
    
    return true;
  });

  // Get unique categories for dropdown
  const categories = Array.from(new Set(dsaProblems.map(p => p.category)));

  useEffect(() => {
    if (selectedProblem) {
      const problem = dsaProblems.find((p) => p.id === selectedProblem);
      if (problem) {
        const template = problem.templates[language as keyof typeof problem.templates];
        if (template) {
          setCode(template);
        }
      }
    } else {
      setCode(defaultCode[language]);
    }
  }, [language, selectedProblem]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Running code...");

    try {
      // Call the API endpoint for code execution
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setOutput(`Error: ${result.error || 'Failed to execute code'}\n${result.details || ''}`);
        toast({
          title: "Execution Failed",
          description: result.error || "Failed to execute code",
          variant: "destructive",
        });
      } else {
        setOutput(result.output || 'Code executed successfully (no output)');
        
        if (result.success) {
          toast({
            title: "Success!",
            description: `${languages.find(l => l.id === language)?.name} code executed successfully`,
          });
        }
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}\n\nPlease check your internet connection and try again.`);
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(selectedProblem 
      ? dsaProblems.find(p => p.id === selectedProblem)?.templates[language as keyof typeof dsaProblems[0]['templates']] || defaultCode[language]
      : defaultCode[language]
    );
    setOutput("");
    toast({
      title: "Code Reset",
      description: "Editor has been reset to default template",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = languages.find(l => l.id === language)?.extension || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: `Code saved as code.${extension}`,
    });
  };

  // Save code to Firebase
  const handleSaveCode = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save your code",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProblem) {
      toast({
        title: "No Problem Selected",
        description: "Please select a problem to save code for",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveCode(user.uid, selectedProblem, language, code);
      setHasUnsavedChanges(false);
      toast({
        title: "Code Saved! ✅",
        description: "Your code has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved code from Firebase
  const handleLoadCode = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to load saved code",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProblem) {
      toast({
        title: "No Problem Selected",
        description: "Please select a problem to load code for",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const savedCode = await loadCode(user.uid, selectedProblem, language);
      if (savedCode) {
        setCode(savedCode);
        setHasUnsavedChanges(false);
        toast({
          title: "Code Loaded! 📂",
          description: "Your saved code has been loaded",
        });
      } else {
        toast({
          title: "No Saved Code",
          description: "No saved code found for this problem and language",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load saved code when problem or language changes
  useEffect(() => {
    if (user && selectedProblem) {
      loadCode(user.uid, selectedProblem, language).then((savedCode) => {
        if (savedCode) {
          setCode(savedCode);
          setHasUnsavedChanges(false);
        }
      });
    }
  }, [user, selectedProblem, language]);

  // Track code changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [code]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Code Playground</h1>
        <p className="text-muted-foreground">
          Practice coding, test algorithms, and solve DSA problems in real-time
        </p>
      </div>

      <Tabs defaultValue="playground" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="problems">DSA Problems</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Code Editor</CardTitle>
                    <CardDescription>Write and test your code</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {selectedProblem && user && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleLoadCode} 
                          disabled={isLoading}
                          className="hidden sm:flex"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FolderOpen className="h-4 w-4 mr-2" />
                          )}
                          Load
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleSaveCode} 
                          disabled={isSaving || !hasUnsavedChanges}
                          className="hidden sm:flex"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {hasUnsavedChanges ? "Save *" : "Saved"}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button onClick={handleRunCode} disabled={isRunning}>
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProblem && user && (
                  <div className="mb-4 flex gap-2 sm:hidden">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadCode} 
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FolderOpen className="h-4 w-4 mr-2" />
                      )}
                      Load
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSaveCode} 
                      disabled={isSaving || !hasUnsavedChanges}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {hasUnsavedChanges ? "Save *" : "Saved"}
                    </Button>
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <Editor
                    height="500px"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>Code execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm min-h-[500px] max-h-[500px] overflow-auto">
                  {output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <p className="text-muted-foreground">
                      Click &quot;Run&quot; to see output here...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          {!selectedProblem ? (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">DSA Practice Problems</h2>
                  <p className="text-sm md:text-base text-muted-foreground">Select a problem to start coding</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredProblems.length} of {dsaProblems.length} Problems
                </div>
              </div>

              {/* Filters Section */}
              <Card className="mb-6">
                <CardContent className="pt-6 space-y-4">
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search problems by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    {/* Category Dropdown */}
                    <select
                      value={selectedCategory || ""}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="px-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Chips */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium mr-2">Difficulty:</span>
                    <button
                      onClick={() => setSelectedDifficulty(selectedDifficulty === "Easy" ? null : "Easy")}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedDifficulty === "Easy"
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200"
                      }`}
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty(selectedDifficulty === "Medium" ? null : "Medium")}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedDifficulty === "Medium"
                          ? "bg-yellow-600 text-white shadow-md"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-200"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty(selectedDifficulty === "Hard" ? null : "Hard")}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedDifficulty === "Hard"
                          ? "bg-red-600 text-white shadow-md"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-200"
                      }`}
                    >
                      Hard
                    </button>
                    
                    {/* Clear Filters */}
                    {(searchQuery || selectedDifficulty || selectedCategory) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDifficulty(null);
                          setSelectedCategory(null);
                          toast({
                            title: "Filters Cleared",
                            description: "All filters have been reset",
                          });
                        }}
                        className="ml-auto px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((problem) => (
                  <Card
                    key={problem.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedProblem(problem.id);
                    }}
                  >
                    <CardHeader className="space-y-3 p-4 md:p-6">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base md:text-lg line-clamp-2">{problem.title}</CardTitle>
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap shrink-0 ${
                            problem.difficulty === "Easy"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : problem.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {problem.category}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm">
                        {problem.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No problems found matching your filters. Try adjusting your search.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <>
              {(() => {
                const problem = dsaProblems.find(p => p.id === selectedProblem);
                if (!problem) return null;
                
                return (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        {/* Mobile: Back button at top */}
                        <div className="md:hidden mb-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedProblem(null)}
                            className="w-full"
                          >
                            ← Back to Problems
                          </Button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                              <CardTitle className="text-xl md:text-2xl">{problem.title}</CardTitle>
                              <span
                                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                  problem.difficulty === "Easy"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : problem.difficulty === "Medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {problem.difficulty}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
                                {problem.category}
                              </span>
                            </div>
                            <CardDescription className="text-sm md:text-base">
                              {problem.description}
                            </CardDescription>
                          </div>
                          
                          {/* Desktop: Back button on right */}
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedProblem(null)}
                            className="hidden md:flex whitespace-nowrap"
                          >
                            ← Back to Problems
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Examples Section */}
                        <div>
                          <h3 className="font-semibold mb-3 text-base md:text-lg">Examples:</h3>
                          <div className="space-y-4">
                            {problem.examples.map((example, idx) => (
                              <div key={idx} className="bg-muted p-3 md:p-4 rounded-lg space-y-2">
                                <div className="break-words">
                                  <span className="font-semibold text-sm md:text-base">Input: </span>
                                  <code className="text-xs md:text-sm break-all">{example.input}</code>
                                </div>
                                <div className="break-words">
                                  <span className="font-semibold text-sm md:text-base">Output: </span>
                                  <code className="text-xs md:text-sm break-all">{example.output}</code>
                                </div>
                                {example.explanation && (
                                  <div className="break-words">
                                    <span className="font-semibold text-sm md:text-base">Explanation: </span>
                                    <span className="text-xs md:text-sm">{example.explanation}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Constraints Section */}
                        <div>
                          <h3 className="font-semibold mb-3 text-base md:text-lg">Constraints:</h3>
                          <ul className="list-disc list-inside space-y-1 bg-muted p-3 md:p-4 rounded-lg">
                            {problem.constraints.map((constraint, idx) => (
                              <li key={idx} className="text-xs md:text-sm break-words">{constraint}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Start Coding Button */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          {/* <Button 
                            onClick={() => {
                              // Switch to Playground tab
                              const playgroundTab = document.querySelector('[value="playground"]') as HTMLElement;
                              playgroundTab?.click();
                            }}
                            className="flex-1 w-full sm:w-auto"
                          >
                            Start Coding →
                          </Button> */}
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "Template Loaded",
                                description: `${problem.title} template loaded in editor`,
                              });
                            }}
                            className="w-full sm:w-auto"
                          >
                            Load Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
