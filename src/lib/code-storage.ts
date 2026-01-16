export interface SavedCode {
  userId: string;
  problemId: string;
  language: string;
  code: string;
  lastSaved: Date;
}

// Save code to server
export async function saveCode(
  userId: string,
  problemId: string,
  language: string,
  code: string
): Promise<void> {
  try {
    const response = await fetch("/api/playground/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problemId,
        language,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save code");
    }
  } catch (error) {
    console.error("Error saving code:", error);
    throw error;
  }
}

// Load saved code from server
export async function loadCode(
  userId: string,
  problemId: string,
  language: string
): Promise<string | null> {
  try {
    const response = await fetch(`/api/playground/code?problemId=${problemId}&language=${language}`, {
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to load code");
    }

    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error("Error loading code:", error);
    return null;
  }
}

// Check if saved code exists
export async function hasSavedCode(
  userId: string,
  problemId: string,
  language: string
): Promise<boolean> {
  try {
    const code = await loadCode(userId, problemId, language);
    return code !== null;
  } catch (error) {
    console.error("Error checking saved code:", error);
    return false;
  }
}
