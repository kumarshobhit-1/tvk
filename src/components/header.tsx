"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { LayoutGrid, BookOpen, LogOut, LogIn, User as UserIcon, Menu, Info, Shield, Mail, Code2, Home, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import React from "react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" {...props}>
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C327.3 114.3 290.5 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
  </svg>
);

const navLinks = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/dsa", label: "DSA Sheet", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/cs", label: "CS Subjects", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/exam", label: "Exams", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/library", label: "PDF Library", icon: <FileText className="h-4 w-4" /> },
  { href: "/playground", label: "Playground", icon: <Code2 className="h-4 w-4" /> },
  { href: "/about", label: "About Us", icon: <Info className="h-4 w-4" /> },
  { href: "/contact", label: "Contact Us", icon: <Mail className="h-4 w-4" /> },
];

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const checkAdminStatus = async () => {
      const userDocRef = doc(db, "users", user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  // const handleLogin = async () => {
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     await signInWithPopup(auth, provider);
  //     router.push("/");
  //   } catch (error) {
  //     console.error("Error signing in with Google: ", error);
  //   }
  // };

  // const handleLogout = async () => {
  //   await signOut(auth);
  //   router.push("/");
  // };

  // ...existing code...
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);
      
      // Create session cookie
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        console.error('Failed to create session:', await response.text());
        throw new Error('Session creation failed');
      }
      
      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };
// ...existing code...
  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
      await signOut(auth);
    } finally {
      router.push('/');
    }
  };
// ...existing code...

  const NavContent = () => (
    <nav className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 text-sm font-medium">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-2 transition-colors hover:text-foreground",
            pathname === link.href ? "text-foreground" : "text-muted-foreground"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* === FIX IS HERE === Added 'justify-between' */}
      <div className="container flex h-14 items-center justify-between">
        
        {/* This container groups left-side items for better layout control */}
        <div className="flex items-center gap-4">
            <div className="md:hidden"> {/* Mobile Menu Trigger */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="pr-0">
                        <div className="flex items-center justify-between mb-4 pr-6"><Logo /></div>
                        <div className="flex flex-col gap-4"><NavContent /></div>
                    </SheetContent>
                </Sheet>
            </div>
             
            {/* Desktop Logo and Nav */}
            <div className="hidden md:flex items-center gap-6">
                <Logo />
                <NavContent />
            </div>
        </div>
        
        {/* This container is for the right-side profile icon */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {loading ? (
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) ?? <UserIcon />}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admintvk01" className="flex items-center cursor-pointer w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center cursor-pointer w-full">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Login with Google
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}