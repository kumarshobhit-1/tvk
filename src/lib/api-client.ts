// src/lib/api-client.ts
import { auth } from "@/lib/firebase";

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get fresh ID token
  const token = await user.getIdToken();

  // Add authorization header
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
