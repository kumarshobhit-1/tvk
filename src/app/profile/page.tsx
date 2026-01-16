import { redirect } from "next/navigation";

export default function MyProgressPage() {
  // Redirect to dashboard since that's where progress tracking is handled
  redirect("/dashboard");
}