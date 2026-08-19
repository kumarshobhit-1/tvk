"use client"
import * as React from "react";

// import type { Metadata } from "next"; // Remove this
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/header";
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/theme-context';
import Loading from '@/components/ui/loading';
import { useLoading } from '@/hooks/use-loading';
import { Footer } from "@/components/ui/footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { ExamExpiryChecker } from "@/components/exam/ExamExpiryChecker";
import { usePathname } from "next/navigation";
import Script from "next/script";


// Remove metadata export - not allowed in client components
// export const metadata: Metadata = {
//   title: "Code Minted",
//   description: "Your guide to mastering DSA and CS fundamentals.",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { isLoading } = useLoading();
  const pathname = usePathname();
  const isExamRunnerPage = pathname ? (pathname.startsWith("/exam/") && !pathname.startsWith("/exam/category/") && !pathname.startsWith("/exam/leaderboard/")) : false;
  
  // Add head tags directly in JSX for client component
  React.useEffect(() => {
    document.title = "The Victory Key | Home";
    
    // Add favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔑</text></svg>');
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Your guide to mastering DSA and CS fundamentals. Master coding interviews with curated problems, interactive playground, and skill assessments.');
    
    // Add Open Graph tags for better social media sharing
    const ogTags = [
      { property: 'og:title', content: 'The Victory Key - Master DSA & CS Fundamentals' },
      { property: 'og:description', content: 'Your guide to mastering DSA and CS fundamentals. Master coding interviews with curated problems, interactive playground, and skill assessments.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'The Victory Key' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'The Victory Key - Master DSA & CS Fundamentals' },
      { name: 'twitter:description', content: 'Your guide to mastering DSA and CS fundamentals.' },
      { name: 'theme-color', content: '#000000' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' }
    ];
    
    ogTags.forEach(tag => {
      const existingTag = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
      if (!existingTag) {
        const meta = document.createElement('meta');
        if (tag.property) {
          meta.setAttribute('property', tag.property);
        } else {
          meta.setAttribute('name', tag.name!);
        }
        meta.setAttribute('content', tag.content);
        document.head.appendChild(meta);
      }
    });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {!isExamRunnerPage && (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2480475355692793"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        {isLoading && <Loading />}
        <div className={isLoading ? 'hidden' : 'block'}>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <ExamExpiryChecker />
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster />
                <WhatsAppButton />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </div>
        <Footer />
      </body>
    </html>
  );
}