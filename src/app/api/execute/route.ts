import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/firebase-admin";

// Language mapping for Piston API
const languageMap: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "c++",
  c: "c",
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifySessionCookie(sessionCookie);

    const { code, language } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    // Map language to Piston API format
    const pistonLanguage = languageMap[language];
    if (!pistonLanguage) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Call Piston API (Free code execution service)
    const pistonResponse = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: pistonLanguage,
        version: "*", // Use latest version
        files: [
          {
            name: `main.${language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}`,
            content: code,
          },
        ],
        stdin: "", // Standard input (empty for now)
        args: [], // Command line arguments
        compile_timeout: 10000, // 10 seconds
        run_timeout: 3000, // 3 seconds
        compile_memory_limit: -1, // No limit
        run_memory_limit: -1, // No limit
      }),
    });

    if (!pistonResponse.ok) {
      throw new Error(`Piston API error: ${pistonResponse.statusText}`);
    }

    const result = await pistonResponse.json();

    // Process the output
    let output = "";
    let success = true;

    // Combine stdout and stderr
    if (result.run && result.run.output) {
      output = result.run.output;
    } else if (result.run && result.run.stdout) {
      output = result.run.stdout;
      if (result.run.stderr) {
        output += "\n" + result.run.stderr;
      }
    }

    // Check for compilation errors (for compiled languages)
    if (result.compile && result.compile.output) {
      output = result.compile.output + "\n" + output;
    }

    // Check if there were any errors
    if (result.run && result.run.code !== 0) {
      success = false;
    }

    // If no output, show a success message
    if (!output.trim()) {
      output = "Code executed successfully (no output)";
    }

    return NextResponse.json({
      output: output.trim(),
      success,
      language: pistonLanguage,
      version: result.language || "unknown",
    });

  } catch (error: any) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute code", 
        details: error.message,
        output: `Error: ${error.message}\n\nPlease check your code and try again.`,
        success: false,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status and supported languages
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifySessionCookie(sessionCookie);

    // Test Piston API availability
    const response = await fetch("https://emkc.org/api/v2/piston/runtimes");
    const runtimes = await response.json();
    
    return NextResponse.json({
      status: "online",
      message: "Code execution API endpoint using Piston API (Free)",
      supportedLanguages: Object.keys(languageMap),
      pistonStatus: "connected",
      availableRuntimes: runtimes.length,
      note: "All languages are now supported via Piston API",
    });
  } catch (error) {
    return NextResponse.json({
      status: "online",
      message: "Code execution API endpoint",
      supportedLanguages: Object.keys(languageMap),
      pistonStatus: "unknown",
      note: "Using free Piston API for code execution",
    });
  }
}
