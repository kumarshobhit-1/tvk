"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Linkedin, Twitter, Send, Mail, Phone, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Loading from "@/components/ui/loading"; 

export default function ContactPage() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (data.success) {
      toast({
        title: "Message Sent! 🚀",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      (event.target as HTMLFormElement).reset();
    } else {
      console.error("Error from Web3Forms:", data);
      toast({
        title: "Uh oh! Something went wrong.",
        description: data.message || "There was a problem with your request.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const FormSkeleton = () => (
    <div className="bg-card p-8 rounded-lg border">
        <h2 className="text-2xl font-bold mb-6"><Skeleton className="h-8 w-48" /></h2>
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
            </div>
            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-24 w-full" /></div>
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  );

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tighter">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            We'd love to hear from you! Whether you have a question, feedback, or just want to say hi, feel free to reach out.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-card p-8 rounded-lg border">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit}>
                <input type="hidden" name="access_key" value="545e2ba7-13bf-4178-82ea-9408ac159d04" />
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      {user ? (
                        <Input type="text" id="name" name="name" defaultValue={user.displayName || ''} readOnly className="mt-2 bg-muted cursor-not-allowed" />
                      ) : (
                        <Input type="text" id="name" name="name" placeholder="Your Name" required className="mt-2" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {user ? (
                        <Input type="email" id="email" name="email" defaultValue={user.email || ''} readOnly className="mt-2 bg-muted cursor-not-allowed" />
                      ) : (
                        <Input type="email" id="email" name="email" placeholder="you@example.com" required className="mt-2" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input type="text" id="subject" name="subject" placeholder="What's this about?" required className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" placeholder="Your message..." required rows={5} className="mt-2" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>) : (<><Send className="mr-2 h-4 w-4" />Send Message</>)}
                  </Button>
                </div>
              </form>
            </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-muted-foreground mb-6">You can also reach us via email or connect with us on our social channels.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <a href="mailto:Consultantstvk@gmail.com" className="text-lg hover:underline">Consultantstvk@gmail.com</a>
                </div>
              {/* <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-lg text-muted-foreground">Coming Soon...</span>
              </div> */}
            </div>
          </div>
            {/* <div><h3 className="text-xl font-semibold mb-4">Follow Us</h3><div className="flex items-center gap-6"><Link href="#" target="_blank" className="text-muted-foreground hover:text-primary"><Twitter size={28} /></Link><Link href="#" target="_blank" className="text-muted-foreground hover:text-primary"><Github size={28} /></Link><Link href="#" target="_blank" className="text-muted-foreground hover:text-primary"><Linkedin size={28} /></Link></div></div> */}
          </div>
        </div>
      </div>
    </div>
  );
}