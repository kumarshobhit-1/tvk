import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function Page() {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex items-start gap-4 border-b px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">RBI</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">Resource & background information</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <div className="flex flex-col items-start gap-4">
            <p className="text-lg font-medium">Coming soon</p>
            <p className="text-sm text-muted-foreground">We are preparing this section — content will be available shortly. Stay tuned!</p>
            <span className="inline-flex items-center rounded-full bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">Coming soon</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
